"""
AI Evaluator – Tích hợp Google Gemini API để sinh nhận xét bằng tiếng Việt.
Fallback về rule-based nếu API key là 'mock' hoặc có lỗi.
"""
from typing import List, Dict, Optional
from app.core.config import settings


def _build_single_exam_prompt(
    score: float,
    correct_count: int,
    total_count: int,
    knowledge_stats: List[Dict],
    chapter_stats: List[Dict],
    error_details: Dict,
    subject: str = "Toán"
) -> str:
    error_text = ""
    for kt, topics in error_details.items():
        error_text += f"\n* Các câu bạn làm sai liên quan đến {kt}:\n"
        for topic, stats in topics.items():
            error_text += f"  - {topic} ({stats['wrong']}/{stats['total']})\n"

    return f"""Bạn là giáo viên môn {subject}. Hãy viết đánh giá kết quả bài thi theo ĐÚNG CẤU TRÚC sau đây:

BẠN LÀM ĐÚNG {correct_count}/{total_count}
ĐÁNH GIÁ KIẾN THỨC HỌC SINH
{error_text}

---
NHẬN XÉT CHI TIẾT:
(Viết thêm 3-4 câu nhận xét về điểm mạnh, điểm yếu và lời khuyên học tập dựa trên số liệu trên. Giọng điệu thân thiện, khích lệ.)"""


def _build_multi_exam_prompt(
    exams_history: List[Dict],
    subject: str = "Toán"
) -> str:
    history_text = "\n".join([
        f"- Bài {i+1} ({e['date']}): {e['score']:.1f}đ | Khái niệm: {e.get('concept_acc', 0):.0f}% | Định lý: {e.get('theorem_acc', 0):.0f}% | Bài tập: {e.get('exercise_acc', 0):.0f}%"
        for i, e in enumerate(exams_history)
    ])
    scores = [e['score'] for e in exams_history]
    trend = "tăng" if scores[-1] > scores[0] else ("giảm" if scores[-1] < scores[0] else "ổn định")

    return f"""Bạn là giáo viên phân tích tiến bộ học tập môn {subject}. Dựa trên {len(exams_history)} bài kiểm tra gần nhất, hãy viết đánh giá tổng hợp (150-200 từ) bằng tiếng Việt:

Lịch sử điểm số:
{history_text}

Xu hướng điểm: {trend} (từ {scores[0]:.1f} → {scores[-1]:.1f})

Yêu cầu phân tích:
1. Nhận xét xu hướng tiến bộ tổng thể
2. Xác định kiến thức nào học sinh đang cải thiện tốt
3. Xác định kiến thức nào vẫn còn yếu và chưa cải thiện
4. Đề xuất chiến lược ôn tập cụ thể cho giai đoạn tới
Viết với giọng điệu động viên, khoa học."""


def _rule_based_feedback(
    correct_count: int, 
    total_count: int, 
    error_details: Dict
) -> str:
    error_text = ""
    for kt, topics in error_details.items():
        error_text += f"\n* Các câu bạn làm sai liên quan đến {kt}:\n"
        for topic, stats in topics.items():
            error_text += f"  - {topic} ({stats['wrong']}/{stats['total']})\n"

    if not error_text:
        error_text = "\nChúc mừng! Bạn không làm sai câu nào thuộc các loại kiến thức chính."

    return (
        f"BẠN LÀM ĐÚNG {correct_count}/{total_count}\n"
        f"ĐÁNH GIÁ KIẾN THỨC HỌC SINH\n"
        f"{error_text}\n"
        f"---\n"
        f"NHẬN XÉT: Bạn đã hoàn thành bài thi. Hãy xem lại các phần sai ở trên để củng cố kiến thức nhé!"
    )


def _rule_based_multi_feedback(exams_history: List[Dict]) -> str:
    scores = [e['score'] for e in exams_history]
    avg = sum(scores) / len(scores)
    trend = "có xu hướng tăng" if scores[-1] > scores[0] else ("có xu hướng giảm" if scores[-1] < scores[0] else "ổn định")
    best = max(scores)
    worst = min(scores)
    return (
        f"📈 Phân tích {len(scores)} bài kiểm tra: Điểm trung bình {avg:.1f}/100, "
        f"điểm cao nhất {best:.1f}, thấp nhất {worst:.1f}. "
        f"Kết quả học tập {trend} (từ {scores[0]:.1f} → {scores[-1]:.1f}). "
    )


async def generate_single_exam_feedback(
    score: float,
    correct_count: int,
    total_count: int,
    knowledge_stats: List[Dict],
    chapter_stats: List[Dict],
    error_details: Dict,
    subject: str = "Toán"
) -> str:
    if settings.GEMINI_API_KEY == "mock":
        return _rule_based_feedback(correct_count, total_count, error_details)

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = _build_single_exam_prompt(score, correct_count, total_count, knowledge_stats, chapter_stats, error_details, subject)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return _rule_based_feedback(correct_count, total_count, error_details)


async def generate_multi_exam_feedback(
    exams_history: List[Dict],
    subject: str = "Toán"
) -> str:
    if settings.GEMINI_API_KEY == "mock":
        return _rule_based_multi_feedback(exams_history)

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = _build_multi_exam_prompt(exams_history, subject)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return _rule_based_multi_feedback(exams_history)
