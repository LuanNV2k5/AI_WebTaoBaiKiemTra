from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean,
    DateTime, ForeignKey, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base

class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"

# KnowledgeType không còn là Enum cứng nữa, mà lưu trong DB
class KnowledgeTypeModel(Base):
    __tablename__ = "knowledge_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    
    questions = relationship("Question", back_populates="kt_rel")

class Difficulty(int, enum.Enum):
    easy = 1
    medium = 2
    hard = 3

# ─────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(Text, nullable=False)
    full_name = Column(String(100))
    role = Column(SAEnum(UserRole), default=UserRole.student)
    grade = Column(Integer, nullable=True)  # Khối lớp (VD: 10, 11, 12)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    questions = relationship("Question", back_populates="creator")
    exams_created = relationship("Exam", back_populates="creator")
    submissions = relationship("Submission", back_populates="user")

# ─────────────────────────────────────────────
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    correct_answer = Column(String(1), nullable=False)  # A/B/C/D
    explanation = Column(Text)                           # Giải thích đáp án

    subject = Column(String(100), default="Toán")
    grade = Column(Integer, default=10)                  # Khối lớp
    chapter = Column(Integer, nullable=False)
    lesson = Column(Integer, default=1)
    chapter_name = Column(String(200))
    knowledge_type = Column(String(100), ForeignKey("knowledge_types.name"), nullable=False)
    
    kt_rel = relationship("KnowledgeTypeModel", back_populates="questions")
    difficulty = Column(Integer, default=1)              # 1=Dễ, 2=TB, 3=Khó
    time_estimate = Column(Integer, default=60)          # giây

    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="questions")
    exam_links = relationship("ExamQuestion", back_populates="question")
    submission_details = relationship("SubmissionDetail", back_populates="question")

# ─────────────────────────────────────────────
class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    subject = Column(String(100), default="Toán")
    grade = Column(Integer, default=10)                  # Khối lớp
    description = Column(Text)
    time_limit = Column(Integer, default=45)             # phút
    is_published = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="exams_created")
    question_links = relationship("ExamQuestion", back_populates="exam", order_by="ExamQuestion.question_order")
    submissions = relationship("Submission", back_populates="exam")

    @property
    def total_questions(self):
        return len(self.question_links)

# ─────────────────────────────────────────────
class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    exam_id = Column(Integer, ForeignKey("exams.id"), primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"), primary_key=True)
    question_order = Column(Integer, default=0)

    exam = relationship("Exam", back_populates="question_links")
    question = relationship("Question", back_populates="exam_links")

# ─────────────────────────────────────────────
class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    answers = Column(JSON, default={})                   # {question_id: "A"}
    score = Column(Float, default=0.0)                   # 0-100 %
    time_spent = Column(Integer, default=0)              # giây
    ai_feedback = Column(Text)                           # Nhận xét AI
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="submissions")
    exam = relationship("Exam", back_populates="submissions")
    details = relationship("SubmissionDetail", back_populates="submission")

# ─────────────────────────────────────────────
class SubmissionDetail(Base):
    __tablename__ = "submission_details"

    submission_id = Column(Integer, ForeignKey("submissions.id"), primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"), primary_key=True)
    user_answer = Column(String(1))
    is_correct = Column(Boolean, default=False)

    submission = relationship("Submission", back_populates="details")
    question = relationship("Question", back_populates="submission_details")
