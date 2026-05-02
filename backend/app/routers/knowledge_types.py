from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import KnowledgeTypeModel, User
from pydantic import BaseModel
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/knowledge-types", tags=["knowledge-types"])

class KTCreate(BaseModel):
    name: str

class KTOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

@router.get("", response_model=List[KTOut])
def list_knowledge_types(db: Session = Depends(get_db)):
    return db.query(KnowledgeTypeModel).all()

@router.post("", response_model=KTOut, status_code=status.HTTP_201_CREATED)
def create_knowledge_type(
    data: KTCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền này")
    
    existing = db.query(KnowledgeTypeModel).filter(KnowledgeTypeModel.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Loại kiến thức này đã tồn tại")
    
    kt = KnowledgeTypeModel(name=data.name)
    db.add(kt)
    db.commit()
    db.refresh(kt)
    return kt

@router.put("/{kt_id}", response_model=KTOut)
def update_knowledge_type(
    kt_id: int,
    data: KTCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền này")
    
    kt = db.query(KnowledgeTypeModel).filter(KnowledgeTypeModel.id == kt_id).first()
    if not kt:
        raise HTTPException(status_code=404, detail="Không tìm thấy loại kiến thức")
    
    # Update related questions if name changes
    # Note: Since knowledge_type in Question is a string, we need to update it manually if name changes
    # or let the foreign key handle it if configured with ON UPDATE CASCADE (not used here yet)
    # Actually, let's just update the name
    kt.name = data.name
    db.commit()
    db.refresh(kt)
    return kt

@router.delete("/{kt_id}")
def delete_knowledge_type(
    kt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Chỉ Admin mới có quyền này")
    
    kt = db.query(KnowledgeTypeModel).filter(KnowledgeTypeModel.id == kt_id).first()
    if not kt:
        raise HTTPException(status_code=404, detail="Không tìm thấy loại kiến thức")
    
    # Check if any questions use this type
    from app.db.models import Question
    count = db.query(Question).filter(Question.knowledge_type == kt.name).count()
    if count > 0:
        raise HTTPException(status_code=400, detail=f"Không thể xóa vì có {count} câu hỏi đang thuộc loại này")
    
    db.delete(kt)
    db.commit()
    return {"message": "Xóa thành công"}
