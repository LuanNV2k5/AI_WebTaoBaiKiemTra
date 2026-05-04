from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Exam, ExamQuestion, Question, User, KnowledgeTypeModel
from app.core.deps import get_current_user, require_admin
from app.services.exam_generator import generate_exam_genetic
from app.services.ai_evaluator import generate_ai_questions
from app.schemas.schemas import ExamGenerateRequest, ExamGenerateAIRequest, ExamOut, ExamListOut

router = APIRouter(prefix="/api/exams", tags=["exams"])

def _exam_to_out(exam: Exam) -> dict:
    # Lọc bỏ các câu hỏi bị null (nếu có lỗi dữ liệu)
    valid_questions = [link.question for link in exam.question_links if link.question is not None]
    return {
        "id": exam.id,
        "title": exam.title,
        "subject": exam.subject,
        "grade": exam.grade,
        "description": exam.description or "",
        "time_limit": exam.time_limit,
        "total_questions": len(valid_questions),
        "is_published": exam.is_published,
        "created_by": exam.created_by,
        "created_at": exam.created_at,
        "questions": valid_questions,
    }

@router.get("", response_model=List[ExamListOut])
def list_exams(
    grade: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Exam).filter(Exam.is_published == True)
    if grade:
        q = q.filter(Exam.grade == grade)
    elif current_user.role == "student" and current_user.grade:
        q = q.filter(Exam.grade == current_user.grade)
    exams = q.order_by(Exam.created_at.desc()).all()
    result = []
    for exam in exams:
        result.append({
            "id": exam.id,
            "title": exam.title,
            "subject": exam.subject,
            "grade": exam.grade,
            "time_limit": exam.time_limit,
            "total_questions": len(exam.question_links),
            "created_at": exam.created_at,
        })
    return result

@router.get("/{exam_id}", response_model=ExamOut)
def get_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Đề thi không tồn tại")
    return _exam_to_out(exam)

@router.post("/generate", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
def generate_exam(
    req: ExamGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo đề thi tự động dùng Genetic Algorithm."""
    selected_questions = generate_exam_genetic(
        db=db,
        chapters=req.chapters,
        knowledge_types=req.knowledge_types,
        total_questions=req.total_questions,
        difficulty_distribution=req.difficulty_distribution or {"easy": 40, "medium": 40, "hard": 20},
        time_limit=req.time_limit,
        subject=req.subject,
        grade=req.grade
    )

    if not selected_questions:
        raise HTTPException(status_code=400, detail="Không đủ câu hỏi phù hợp trong ngân hàng")

    # Tạo đề thi mới
    exam = Exam(
        title=req.title,
        subject=req.subject,
        grade=req.grade,
        description=f"Đề thi {req.total_questions} câu | {req.time_limit} phút | Khối {req.grade}",
        time_limit=req.time_limit,
        created_by=current_user.id,
        is_published=True,
    )
    db.add(exam)
    db.flush()

    # Liên kết câu hỏi
    for i, q in enumerate(selected_questions):
        link = ExamQuestion(exam_id=exam.id, question_id=q.id, question_order=i)
        db.add(link)

    db.commit()
    db.refresh(exam)
    return _exam_to_out(exam)

import re

def clean_math_formula(text: str) -> str:
    if not text: return text
    
    # 1. Đảm bảo có dấu \ trước sqrt
    text = re.sub(r'(?<!\\)sqrt', r'\\sqrt', text)
    
    # 2. Xử lý sqrt144 -> \sqrt{144} (số đứng sau sqrt không ngoặc)
    text = re.sub(r'\\sqrt([0-9]+)', r'\\sqrt{\1}', text)
    
    # 3. Xử lý \sqrt(...) -> \sqrt{...}
    text = re.sub(r'\\sqrt\((.*?)\)', r'\\sqrt{\1}', text)
    
    # 4. Xử lý ký hiệu √
    text = re.sub(r'√\((.*?)\)', r'\\sqrt{\1}', text)
    text = re.sub(r'√([0-9a-zA-Z]+)', r'\\sqrt{\1}', text)
    
    # 5. Đảm bảo bọc trong $...$ nếu có các lệnh LaTeX
    # Chúng ta tìm các đoạn có \sqrt hoặc các phép toán mũ ^ mà chưa có $
    if ('\\sqrt' in text or '^' in text or '\\frac' in text) and '$' not in text:
        text = f"${text}$"
        
    return text

@router.post("/generate-ai", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
async def generate_exam_ai(
    req: ExamGenerateAIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        ai_questions = await generate_ai_questions(
            topic=req.topic,
            grade=req.grade,
            num_questions=req.total_questions,
            difficulty_distribution=req.difficulty_distribution or {"easy": 40, "medium": 40, "hard": 20},
            subject=req.subject
        )

        if not ai_questions:
            raise HTTPException(status_code=500, detail="AI không thể sinh câu hỏi vào lúc này (có thể do lỗi kết nối hoặc giới hạn API)")

        # Kiểm tra/Tạo Knowledge Type nếu chưa có (để tránh lỗi FK)
        existing_kt = db.query(KnowledgeTypeModel).filter(KnowledgeTypeModel.name == req.knowledge_type).first()
        if not existing_kt:
            new_kt = KnowledgeTypeModel(name=req.knowledge_type)
            db.add(new_kt)
            db.flush()

        # Lưu câu hỏi vào DB (Giới hạn đúng số lượng yêu cầu)
        db_questions = []
        for i, q_data in enumerate(ai_questions[:req.total_questions]):
            # Đảm bảo difficulty là int
            diff = q_data.get("difficulty", 1)
            if isinstance(diff, str):
                if "dễ" in diff.lower(): diff = 1
                elif "khó" in diff.lower(): diff = 3
                else: diff = 2
            
            # Xử lý đáp án an toàn
            raw_ans = str(q_data.get("correct_answer", "A")).strip().upper()
            ans = raw_ans[0] if raw_ans else "A"

            q = Question(
                content=clean_math_formula(q_data.get("content", "Câu hỏi không có nội dung")),
                option_a=clean_math_formula(q_data.get("option_a", "A")),
                option_b=clean_math_formula(q_data.get("option_b", "B")),
                option_c=clean_math_formula(q_data.get("option_c", "C")),
                option_d=clean_math_formula(q_data.get("option_d", "D")),
                correct_answer=ans,
                explanation=clean_math_formula(q_data.get("explanation", "")),
                difficulty=diff,
                subject=req.subject,
                grade=req.grade,
                chapter=req.chapter,
                knowledge_type=req.knowledge_type,
                created_by=current_user.id
            )
            db.add(q)
            db_questions.append(q)
        
        db.flush() 

        # Tạo đề thi
        exam = Exam(
            title=req.title,
            subject=req.subject,
            grade=req.grade,
            description=f"Đề thi AI tạo mới | Chủ đề: {req.topic} | {req.total_questions} câu",
            time_limit=req.time_limit,
            created_by=current_user.id,
            is_published=True,
        )
        db.add(exam)
        db.flush()

        # Liên kết câu hỏi
        for i, q in enumerate(db_questions):
            link = ExamQuestion(exam_id=exam.id, question_id=q.id, question_order=i)
            db.add(link)

        db.commit()
        db.refresh(exam)
        return _exam_to_out(exam)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Lỗi hệ thống trong generate_exam_ai: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")

@router.post("/manual", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
def create_exam_manual(
    data: dict, # title, grade, time_limit, question_ids
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    question_ids = data.get("question_ids", [])
    if not question_ids:
        raise HTTPException(status_code=400, detail="Vui lòng chọn ít nhất một câu hỏi")
    
    exam = Exam(
        title=data["title"],
        subject="Toán",
        grade=data["grade"],
        description=f"Đề thi tự chọn | {len(question_ids)} câu | {data['time_limit']} phút",
        time_limit=data["time_limit"],
        created_by=current_user.id,
        is_published=True,
    )
    db.add(exam)
    db.flush()

    for i, q_id in enumerate(question_ids):
        link = ExamQuestion(exam_id=exam.id, question_id=q_id, question_order=i)
        db.add(link)

    db.commit()
    db.refresh(exam)
    return _exam_to_out(exam)

@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    from app.db.models import ExamQuestion, Submission, SubmissionDetail
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Đề thi không tồn tại")
        
    # Xóa các liên kết câu hỏi
    db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).delete()
    
    # Xóa các bài nộp và chi tiết bài nộp
    submissions = db.query(Submission).filter(Submission.exam_id == exam_id).all()
    for sub in submissions:
        db.query(SubmissionDetail).filter(SubmissionDetail.submission_id == sub.id).delete()
        db.delete(sub)
        
    # Cuối cùng xóa đề thi
    db.delete(exam)
    db.commit()

@router.put("/{exam_id}")
def update_exam(
    exam_id: int,
    data: dict, # title, grade, time_limit
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Đề thi không tồn tại")
    
    if "title" in data: exam.title = data["title"]
    if "grade" in data: exam.grade = data["grade"]
    if "time_limit" in data: exam.time_limit = data["time_limit"]
    
    db.commit()
    return {"message": "Cập nhật đề thi thành công"}
