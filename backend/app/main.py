from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine
from app.db import models
from app.routers import auth, questions, exams, submissions, analytics, users, knowledge_types
from app.core.config import settings
import sqlite3
import os

models.Base.metadata.create_all(bind=engine)

def auto_upgrade_db():
    # Dùng sqlite3 trực tiếp để tránh conflict với SQLAlchemy session
    db_path = "quiz_system.db"
    if not os.path.exists(db_path):
        print("DB not found, skipping migration")
        return
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    for table, col in [("users", "grade INTEGER"), ("questions", "grade INTEGER DEFAULT 10"), ("exams", "grade INTEGER DEFAULT 10")]:
        try:
            c.execute(f"ALTER TABLE {table} ADD COLUMN {col}")
            print(f"Added grade to {table}")
        except Exception as e:
            print(f"Skip {table}: {e}")
    try:
        c.execute("UPDATE users SET grade = 10 WHERE role = 'student' AND grade IS NULL")
        print("Updated student grades to 10")
    except Exception as e:
        print("Skip grade update:", e)
    conn.commit()
    conn.close()

auto_upgrade_db()

# Seed knowledge types if table is empty
def seed_kt():
    from app.db.database import SessionLocal
    from app.db.models import KnowledgeTypeModel
    db = SessionLocal()
    if db.query(KnowledgeTypeModel).count() == 0:
        for name in ["Khái niệm", "Định lý", "Tính chất", "Dạng bài tập"]:
            db.add(KnowledgeTypeModel(name=name))
        db.commit()
    db.close()

seed_kt()

app = FastAPI(title=settings.APP_NAME, version="1.0.0", docs_url="/api/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(questions.router)
app.include_router(exams.router)
app.include_router(submissions.router)
app.include_router(analytics.router)
app.include_router(users.router)
app.include_router(knowledge_types.router)

@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.APP_NAME}
