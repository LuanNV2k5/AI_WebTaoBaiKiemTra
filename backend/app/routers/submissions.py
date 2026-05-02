from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import Submission, SubmissionDetail, Exam, ExamQuestion, Question, User
from app.schemas.schemas import SubmissionCreate, SubmissionOut, SubmissionListOut
from app.core.deps import get_current_user
from app.services.ai_evaluator import generate_single_exam_feedback

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

KT_NAMES = {
    "concept": "Khái niệm",
    "theorem": "Định lý",
    "property": "Tính chất",
    "exercise": "Dạng bài tập",
}

@router.get("", response_model=List[SubmissionListOut])
def list_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subs = db.query(Submission).filter(
        Submission.user_id == current_user.id
    ).order_by(Submission.submitted_at.desc()).all()
    return subs

@router.get("/{submission_id}", response_model=SubmissionOut)
def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài nộp")
    
    # Chỉ cho phép chủ nhân bài thi HOẶC Admin xem chi tiết
    if sub.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem bài làm này")
        
    return sub

@router.get("/exam/{exam_id}")
def list_exam_submissions(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền xem danh sách này")
    
    subs = db.query(Submission).filter(Submission.exam_id == exam_id).order_by(Submission.submitted_at.desc()).all()
    
    result = []
    for s in subs:
        result.append({
            "id": s.id,
            "user_id": s.user_id,
            "student_name": s.user.full_name or s.user.username,
            "score": s.score,
            "time_spent": s.time_spent,
            "submitted_at": s.submitted_at
        })
    return result

@router.post("", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
async def submit_exam(
    data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exam = db.query(Exam).filter(Exam.id == data.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Đề thi không tồn tại")

    # Lấy câu hỏi của đề
    exam_questions: List[Question] = [link.question for link in exam.question_links]
    if not exam_questions:
        raise HTTPException(status_code=400, detail="Đề thi chưa có câu hỏi")

    # Chấm điểm
    correct_count = 0
    details = []
    for q in exam_questions:
        user_ans = data.answers.get(str(q.id), "").upper()
        is_correct = user_ans == q.correct_answer.upper()
        if is_correct:
            correct_count += 1
        details.append({"question": q, "user_answer": user_ans or None, "is_correct": is_correct})

    score = (correct_count / len(exam_questions)) * 100

    # Tạo bài nộp
    submission = Submission(
        user_id=current_user.id,
        exam_id=data.exam_id,
        answers=data.answers,
        score=score,
        time_spent=data.time_spent,
    )
    db.add(submission)
    db.flush()

    # Chi tiết từng câu
    for d in details:
        detail = SubmissionDetail(
            submission_id=submission.id,
            question_id=d["question"].id,
            user_answer=d["user_answer"],
            is_correct=d["is_correct"]
        )
        db.add(detail)

    db.commit()
    db.refresh(submission)

    # Tính stats để gọi AI
    kt_groups = {}
    for d in details:
        kt = str(d["question"].knowledge_type.value if hasattr(d["question"].knowledge_type, 'value') else d["question"].knowledge_type)
        if kt not in kt_groups:
            kt_groups[kt] = {"correct": 0, "total": 0}
        kt_groups[kt]["total"] += 1
        if d["is_correct"]:
            kt_groups[kt]["correct"] += 1

    knowledge_stats = [
        {
            "knowledge_type": kt,
            "knowledge_type_vi": KT_NAMES.get(kt, kt),
            "total": v["total"],
            "correct": v["correct"],
            "accuracy": (v["correct"] / v["total"] * 100) if v["total"] > 0 else 0
        }
        for kt, v in kt_groups.items()
    ]

    ch_groups = {}
    for d in details:
        ch = d["question"].chapter
        ch_name = d["question"].chapter_name or f"Chương {ch}"
        if ch not in ch_groups:
            ch_groups[ch] = {"correct": 0, "total": 0, "name": ch_name}
        ch_groups[ch]["total"] += 1
        if d["is_correct"]:
            ch_groups[ch]["correct"] += 1

    chapter_stats = [
        {
            "chapter": ch,
            "chapter_name": v["name"],
            "total": v["total"],
            "correct": v["correct"],
            "accuracy": (v["correct"] / v["total"] * 100) if v["total"] > 0 else 0
        }
        for ch, v in ch_groups.items()
    ]

    # Thống kê chi tiết lỗi để khớp mẫu của thầy
    # Ví dụ: "Các câu bạn làm sai liên quan đến Khái niệm: - Căn thức bậc hai (1/1)"
    error_details = {}
    for d in details:
        if not d["is_correct"]:
            kt = str(d["question"].knowledge_type.value if hasattr(d["question"].knowledge_type, 'value') else d["question"].knowledge_type)
            kt_vi = KT_NAMES.get(kt, kt)
            topic = d["question"].chapter_name or f"Chương {d['question'].chapter}"
            
            if kt_vi not in error_details: error_details[kt_vi] = {}
            if topic not in error_details[kt_vi]: error_details[kt_vi][topic] = {"wrong": 0, "total": 0}
            
            error_details[kt_vi][topic]["wrong"] += 1

    # Tính tổng số câu cùng topic đó trong bài thi (cả đúng lẫn sai)
    for d in details:
        kt = str(d["question"].knowledge_type.value if hasattr(d["question"].knowledge_type, 'value') else d["question"].knowledge_type)
        kt_vi = KT_NAMES.get(kt, kt)
        topic = d["question"].chapter_name or f"Chương {d['question'].chapter}"
        if kt_vi in error_details and topic in error_details[kt_vi]:
            error_details[kt_vi][topic]["total"] += 1

    # Gọi AI feedback với thông tin chi tiết hơn
    ai_text = await generate_single_exam_feedback(
        score=score,
        correct_count=correct_count,
        total_count=len(exam_questions),
        knowledge_stats=knowledge_stats,
        chapter_stats=chapter_stats,
        error_details=error_details,
        subject=exam.subject
    )

    submission.ai_feedback = ai_text
    db.commit()
    db.refresh(submission)

    return submission
