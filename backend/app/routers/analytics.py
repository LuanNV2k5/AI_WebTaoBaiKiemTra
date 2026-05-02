from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Submission, SubmissionDetail, Exam, Question, User
from app.schemas.schemas import StudentAnalytics, KnowledgeStats, ChapterStats
from app.core.deps import get_current_user
from app.services.ai_evaluator import generate_multi_exam_feedback

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

KT_NAMES = {
    "concept": "Khái niệm",
    "theorem": "Định lý",
    "property": "Tính chất",
    "exercise": "Dạng bài tập",
}

@router.get("/me", response_model=StudentAnalytics)
async def get_my_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await _get_student_analytics(current_user.id, db, current_user)

@router.get("/student/{student_id}", response_model=StudentAnalytics)
async def get_student_analytics(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Students chỉ xem được của mình
    if current_user.role != "admin" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    target = db.query(User).filter(User.id == student_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Học sinh không tồn tại")
    return await _get_student_analytics(student_id, db, target)

async def _get_student_analytics(student_id: int, db: Session, user: User) -> StudentAnalytics:
    submissions = db.query(Submission).filter(
        Submission.user_id == student_id
    ).order_by(Submission.submitted_at.asc()).all()

    if not submissions:
        return StudentAnalytics(
            user_id=student_id,
            username=user.username,
            total_exams=0,
            avg_score=0,
            best_score=0,
            worst_score=0,
            knowledge_stats=[],
            chapter_stats=[],
            score_trend=[],
            multi_exam_feedback="Chưa có dữ liệu bài kiểm tra."
        )

    scores = [s.score for s in submissions]
    avg_score = sum(scores) / len(scores)

    # Knowledge stats
    kt_groups: dict = {}
    ch_groups: dict = {}

    for sub in submissions:
        for detail in sub.details:
            q = detail.question
            kt = str(q.knowledge_type.value if hasattr(q.knowledge_type, 'value') else q.knowledge_type)
            if kt not in kt_groups:
                kt_groups[kt] = {"correct": 0, "total": 0}
            kt_groups[kt]["total"] += 1
            if detail.is_correct:
                kt_groups[kt]["correct"] += 1

            ch = q.chapter
            if ch not in ch_groups:
                ch_groups[ch] = {"correct": 0, "total": 0, "name": q.chapter_name or f"Chương {ch}"}
            ch_groups[ch]["total"] += 1
            if detail.is_correct:
                ch_groups[ch]["correct"] += 1

    knowledge_stats = [
        KnowledgeStats(
            knowledge_type=KT_NAMES.get(kt, kt),
            total=v["total"],
            correct=v["correct"],
            accuracy=round(v["correct"] / v["total"] * 100, 1) if v["total"] > 0 else 0
        )
        for kt, v in kt_groups.items()
    ]

    chapter_stats = [
        ChapterStats(
            chapter=ch,
            chapter_name=v["name"],
            total=v["total"],
            correct=v["correct"],
            accuracy=round(v["correct"] / v["total"] * 100, 1) if v["total"] > 0 else 0
        )
        for ch, v in ch_groups.items()
    ]

    score_trend = [
        {
            "date": sub.submitted_at.strftime("%d/%m"),
            "score": round(sub.score, 1),
            "exam_id": sub.exam_id
        }
        for sub in submissions
    ]

    # Multi-exam AI feedback (last 10 exams)
    recent = submissions[-10:]
    exams_history = []
    for sub in recent:
        kt_acc = {}
        for d in sub.details:
            kt = str(d.question.knowledge_type.value if hasattr(d.question.knowledge_type, 'value') else d.question.knowledge_type)
            if kt not in kt_acc:
                kt_acc[kt] = {"c": 0, "t": 0}
            kt_acc[kt]["t"] += 1
            if d.is_correct:
                kt_acc[kt]["c"] += 1
        exams_history.append({
            "date": sub.submitted_at.strftime("%d/%m/%Y"),
            "score": sub.score,
            "concept_acc": kt_acc.get("concept", {}).get("c", 0) / max(kt_acc.get("concept", {}).get("t", 1), 1) * 100,
            "theorem_acc": kt_acc.get("theorem", {}).get("c", 0) / max(kt_acc.get("theorem", {}).get("t", 1), 1) * 100,
            "exercise_acc": kt_acc.get("exercise", {}).get("c", 0) / max(kt_acc.get("exercise", {}).get("t", 1), 1) * 100,
        })

    feedback = await generate_multi_exam_feedback(exams_history) if len(exams_history) >= 2 else "Cần ít nhất 2 bài kiểm tra để phân tích xu hướng."

    return StudentAnalytics(
        user_id=student_id,
        username=user.username,
        total_exams=len(submissions),
        avg_score=round(avg_score, 1),
        best_score=round(max(scores), 1),
        worst_score=round(min(scores), 1),
        knowledge_stats=knowledge_stats,
        chapter_stats=chapter_stats,
        score_trend=score_trend,
        multi_exam_feedback=feedback
    )
