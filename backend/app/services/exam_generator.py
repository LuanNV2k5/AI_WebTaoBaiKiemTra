import random
from typing import List, Optional
from app.db.models import Question
from sqlalchemy.orm import Session


def generate_exam_genetic(
    db: Session,
    chapters: Optional[List[int]],
    knowledge_types: Optional[List[str]],
    total_questions: int,
    difficulty_distribution: dict,  # {"easy": 40, "medium": 40, "hard": 20}
    time_limit: int,  # phút
    subject: str = "Toán",
    grade: int = 10,
    population_size: int = 50,
    generations: int = 100,
) -> List[Question]:
    """
    Thuật toán di truyền (Genetic Algorithm) tạo đề thi tối ưu.
    Hàm fitness đánh giá theo: phân bổ độ khó, phủ chương/bài, loại KT, thời gian.
    """
    # ── Lấy pool câu hỏi từ DB ──────────────────────────────
    query = db.query(Question).filter(Question.subject == subject, Question.grade == grade)
    if chapters:
        query = query.filter(Question.chapter.in_(chapters))
    if knowledge_types:
        query = query.filter(Question.knowledge_type.in_(knowledge_types))
    pool: List[Question] = query.all()

    if len(pool) < total_questions:
        # Fallback: lấy thêm không giới hạn chương/loại
        fallback = db.query(Question).filter(Question.subject == subject, Question.grade == grade).all()
        pool = list({q.id: q for q in (pool + fallback)}.values())

    if len(pool) < total_questions:
        return pool  # Không đủ câu

    # ── Tính target ──────────────────────────────────────────
    target_easy = round(total_questions * difficulty_distribution.get("easy", 34) / 100)
    target_medium = round(total_questions * difficulty_distribution.get("medium", 33) / 100)
    target_hard = total_questions - target_easy - target_medium
    target_time_seconds = time_limit * 60

    def fitness(chromosome: List[Question]) -> float:
        easy_count = sum(1 for q in chromosome if q.difficulty == 1)
        medium_count = sum(1 for q in chromosome if q.difficulty == 2)
        hard_count = sum(1 for q in chromosome if q.difficulty == 3)
        total_time = sum(q.time_estimate for q in chromosome)

        # Score 0-1 mỗi tiêu chí
        diff_score = 1 - (
            abs(easy_count - target_easy) +
            abs(medium_count - target_medium) +
            abs(hard_count - target_hard)
        ) / (total_questions * 3)

        time_score = 1 - min(abs(total_time - target_time_seconds) / target_time_seconds, 1)

        # Đa dạng chương
        chapters_covered = len(set(q.chapter for q in chromosome))
        chapter_score = min(chapters_covered / max(len(chapters or [1]), 1), 1)

        # Đa dạng loại kiến thức
        types_covered = len(set(q.knowledge_type for q in chromosome))
        total_kt_available = db.query(Question.knowledge_type).filter(Question.subject == subject, Question.grade == grade).distinct().count()
        type_score = min(types_covered / max(total_kt_available, 1), 1)

        return 0.40 * diff_score + 0.30 * time_score + 0.15 * chapter_score + 0.15 * type_score

    # ── Khởi tạo quần thể ────────────────────────────────────
    population = [
        random.sample(pool, total_questions)
        for _ in range(population_size)
    ]

    # ── Tiến hóa ─────────────────────────────────────────────
    for _ in range(generations):
        scored = sorted(population, key=fitness, reverse=True)
        survivors = scored[:population_size // 2]

        next_gen = survivors[:]
        while len(next_gen) < population_size:
            parent1, parent2 = random.sample(survivors, 2)
            cut = random.randint(1, total_questions - 1)
            child_ids = {q.id for q in parent1[:cut]}
            child = parent1[:cut][:]
            for q in parent2:
                if q.id not in child_ids and len(child) < total_questions:
                    child.append(q)
                    child_ids.add(q.id)
            # Fill nếu thiếu
            for q in pool:
                if q.id not in child_ids and len(child) < total_questions:
                    child.append(q)
                    child_ids.add(q.id)

            # Mutation (5%)
            if random.random() < 0.05:
                outsiders = [q for q in pool if q.id not in child_ids]
                if outsiders:
                    replace_idx = random.randint(0, len(child) - 1)
                    old = child[replace_idx]
                    new_q = random.choice(outsiders)
                    child[replace_idx] = new_q

            next_gen.append(child)

        population = next_gen

    best = max(population, key=fitness)
    return best
