from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.db.models import UserRole

# ── Auth ──────────────────────────────────────
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.student
    grade: Optional[int] = 10

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: UserRole
    grade: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# ── Question ──────────────────────────────────
class QuestionCreate(BaseModel):
    content: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: Optional[str] = None
    subject: str = "Toán"
    grade: int = 10
    chapter: int
    lesson: int = 1
    chapter_name: Optional[str] = None
    knowledge_type: str
    difficulty: int = 1
    time_estimate: int = 60

class QuestionOut(QuestionCreate):
    id: int
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

# ── Exam ──────────────────────────────────────
class ExamGenerateRequest(BaseModel):
    title: str
    subject: str = "Toán"
    grade: int = 10
    chapters: Optional[list[int]] = None
    knowledge_types: Optional[list[str]] = None
    total_questions: int = 20
    difficulty_distribution: Optional[dict] = {"easy": 40, "medium": 40, "hard": 20}
    time_limit: int = 30  # phút

class ExamOut(BaseModel):
    id: int
    title: str
    subject: str
    grade: int
    description: Optional[str]
    time_limit: int
    total_questions: int
    is_published: bool
    created_by: Optional[int]
    created_at: datetime
    questions: list[QuestionOut] = []

    class Config:
        from_attributes = True

class ExamListOut(BaseModel):
    id: int
    title: str
    subject: str
    grade: int
    time_limit: int
    total_questions: int
    created_at: datetime

    class Config:
        from_attributes = True

# ── Submission ────────────────────────────────
class SubmissionCreate(BaseModel):
    exam_id: int
    answers: dict  # {str(question_id): "A"/"B"/"C"/"D"}
    time_spent: int = 0

class SubmissionDetailOut(BaseModel):
    question_id: int
    user_answer: Optional[str]
    is_correct: bool
    question: QuestionOut

    class Config:
        from_attributes = True

class SubmissionOut(BaseModel):
    id: int
    user_id: int
    exam_id: int
    score: float
    time_spent: int
    ai_feedback: Optional[str]
    submitted_at: datetime
    details: list[SubmissionDetailOut] = []

    class Config:
        from_attributes = True

class SubmissionListOut(BaseModel):
    id: int
    exam_id: int
    score: float
    time_spent: int
    submitted_at: datetime

    class Config:
        from_attributes = True

# ── Analytics ─────────────────────────────────
class KnowledgeStats(BaseModel):
    knowledge_type: str
    total: int
    correct: int
    accuracy: float

class ChapterStats(BaseModel):
    chapter: int
    chapter_name: Optional[str]
    total: int
    correct: int
    accuracy: float

class StudentAnalytics(BaseModel):
    user_id: int
    username: str
    total_exams: int
    avg_score: float
    best_score: float
    worst_score: float
    knowledge_stats: list[KnowledgeStats]
    chapter_stats: list[ChapterStats]
    score_trend: list[dict]  # [{date, score}]
    multi_exam_feedback: Optional[str] = None
