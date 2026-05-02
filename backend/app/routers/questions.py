from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile
import io
import openpyxl
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.database import get_db
from app.db.models import Question, User
from app.schemas.schemas import QuestionCreate, QuestionOut
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/api/questions", tags=["questions"])

@router.get("", response_model=List[QuestionOut])
def list_questions(
    subject: Optional[str] = None,
    grade: Optional[int] = None,
    chapter: Optional[int] = None,
    knowledge_type: Optional[str] = None,
    difficulty: Optional[int] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Question)
    if subject:
        q = q.filter(Question.subject == subject)
    if grade:
        q = q.filter(Question.grade == grade)
    if chapter:
        q = q.filter(Question.chapter == chapter)
    if knowledge_type:
        q = q.filter(Question.knowledge_type == knowledge_type)
    if difficulty:
        q = q.filter(Question.difficulty == difficulty)
    return q.offset(offset).limit(limit).all()

@router.get("/{question_id}", response_model=QuestionOut)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Câu hỏi không tồn tại")
    return q

@router.post("", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    if data.correct_answer.upper() not in ["A", "B", "C", "D"]:
        raise HTTPException(status_code=400, detail="Đáp án đúng phải là A, B, C hoặc D")
    q = Question(**data.model_dump(), created_by=current_user.id)
    q.correct_answer = q.correct_answer.upper()
    db.add(q)
    db.commit()
    db.refresh(q)
    return q

@router.put("/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Câu hỏi không tồn tại")
    for key, value in data.model_dump().items():
        setattr(q, key, value)
    db.commit()
    db.refresh(q)
    return q

@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Câu hỏi không tồn tại")
    db.delete(q)
    db.commit()

@router.post("/upload")
async def upload_questions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file Excel (.xlsx, .xls)")

    try:
        contents = await file.read()
        wb = openpyxl.load_workbook(io.BytesIO(contents))
        ws = wb.active

        # Mapping: Cột A=Nội dung, B=A, C=B, D=C, E=D, F=Đúng, G=Giải thích, H=Khối, I=Chương, J=Loại KT, K=Độ khó (1-3)
        questions_to_add = []
        from app.db.models import KnowledgeTypeModel
        
        # Lấy danh sách KT hiện có để tránh tạo trùng
        existing_kts = {kt.name for kt in db.query(KnowledgeTypeModel).all()}

        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row[0]: continue  # Bỏ dòng trống
            
            content, opt_a, opt_b, opt_c, opt_d, correct, expl, grade, chapter, kt_name, diff = row[:11]
            
            # Xử lý Knowledge Type mới nếu chưa có
            if kt_name and kt_name not in existing_kts:
                new_kt = KnowledgeTypeModel(name=str(kt_name))
                db.add(new_kt)
                db.flush()
                existing_kts.add(kt_name)

            q = Question(
                content=str(content),
                option_a=str(opt_a),
                option_b=str(opt_b),
                option_c=str(opt_c),
                option_d=str(opt_d),
                correct_answer=str(correct).upper(),
                explanation=str(expl) if expl else None,
                grade=int(grade) if grade else 10,
                chapter=int(chapter) if chapter else 1,
                knowledge_type=str(kt_name) if kt_name else "Khác",
                difficulty=int(diff) if diff else 1,
                created_by=current_user.id
            )
            questions_to_add.append(q)

        db.add_all(questions_to_add)
        db.commit()
        return {"message": f"Đã thêm thành công {len(questions_to_add)} câu hỏi!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý file: {str(e)}")
