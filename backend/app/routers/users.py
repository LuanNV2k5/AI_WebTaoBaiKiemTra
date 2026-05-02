from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import io
from typing import List
from app.db.database import get_db
from app.db.models import User, Submission
from app.core.deps import get_current_user
from pydantic import BaseModel
from app.schemas.schemas import UserCreate, UserOut
from app.core.security import get_password_hash
import openpyxl

router = APIRouter(prefix="/api/users", tags=["users"])

class StudentListOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str | None
    grade: int | None
    total_exams: int
    avg_score: float

from sqlalchemy import text

@router.get("/force-upgrade-db")
def force_upgrade_db(db: Session = Depends(get_db)):
    errors = []
    messages = []
    
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN grade INTEGER"))
        db.execute(text("UPDATE users SET grade = 10 WHERE role = 'student'"))
        db.commit()
        messages.append("Users table upgraded")
    except Exception as e:
        db.rollback()
        errors.append(f"Users table error: {str(e)}")
        
    try:
        db.execute(text("ALTER TABLE questions ADD COLUMN grade INTEGER DEFAULT 10"))
        db.commit()
        messages.append("Questions table upgraded")
    except Exception as e:
        db.rollback()
        errors.append(f"Questions table error: {str(e)}")

    try:
        db.execute(text("ALTER TABLE exams ADD COLUMN grade INTEGER DEFAULT 10"))
        db.commit()
        messages.append("Exams table upgraded")
    except Exception as e:
        db.rollback()
        errors.append(f"Exams table error: {str(e)}")

    return {"messages": messages, "errors": errors}

@router.get("/students", response_model=List[StudentListOut])
def get_students(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    
    students = db.query(User).filter(User.role == "student").order_by(User.grade.asc(), User.full_name.asc()).all()
    result = []
    
    for s in students:
        subs = db.query(Submission).filter(Submission.user_id == s.id).all()
        total_exams = len(subs)
        avg_score = sum(sub.score for sub in subs) / total_exams if total_exams > 0 else 0.0
        
        result.append({
            "id": s.id,
            "username": s.username,
            "email": s.email,
            "full_name": s.full_name,
            "grade": s.grade,
            "total_exams": total_exams,
            "avg_score": round(avg_score, 1)
        })
        
    return result

@router.post("/students", response_model=StudentListOut)
def create_student(user_data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username đã tồn tại")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role="student",
        grade=user_data.grade or 10
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "grade": new_user.grade,
        "total_exams": 0,
        "avg_score": 0.0
    }

@router.post("/students/upload")
async def upload_students(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file Excel (.xlsx)")
        
    contents = await file.read()
    try:
        wb = openpyxl.load_workbook(io.BytesIO(contents))
        sheet = wb.active
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc file: {str(e)}")
        
    added_count = 0
    skipped_count = 0
    
    # Giả sử dòng 1 là tiêu đề: Username, Password, Email, Full Name, Grade
    for row in sheet.iter_rows(min_row=2, values_only=True):
        if not row or not row[0]:
            continue
            
        username = str(row[0]).strip()
        password = str(row[1]).strip() if len(row) > 1 and row[1] else "123456"
        email = str(row[2]).strip() if len(row) > 2 and row[2] else f"{username}@quizai.vn"
        full_name = str(row[3]).strip() if len(row) > 3 and row[3] else ""
        try:
            grade = int(row[4]) if len(row) > 4 and row[4] else 10
        except:
            grade = 10
        
        # Kiểm tra trùng lặp
        if db.query(User).filter(User.username == username).first() or \
           db.query(User).filter(User.email == email).first():
            skipped_count += 1
            continue
            
        new_user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role="student",
            grade=grade
        )
        db.add(new_user)
        added_count += 1
        
    db.commit()
    
    return {
        "message": f"Đã thêm {added_count} học sinh. Bỏ qua {skipped_count} do trùng lặp.",
        "added": added_count,
        "skipped": skipped_count
    }
@router.delete("/students/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh")
    # Xóa dữ liệu liên quan
    from sqlalchemy import text
    db.execute(text(f"DELETE FROM submission_details WHERE submission_id IN (SELECT id FROM submissions WHERE user_id = {student_id})"))
    db.execute(text(f"DELETE FROM submissions WHERE user_id = {student_id}"))
    db.delete(student)
    db.commit()

@router.put("/students/{student_id}", response_model=UserOut)
def update_student(
    student_id: int, 
    data: UserCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh")
    
    if data.email != student.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email này đã được sử dụng")

    student.full_name = data.full_name
    student.email = data.email
    student.grade = data.grade
    if data.password:
        from app.core.security import get_password_hash
        student.hashed_password = get_password_hash(data.password)
        
    db.commit()
    db.refresh(student)
    return student
