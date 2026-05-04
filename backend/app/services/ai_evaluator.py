"""
AI Evaluator – Tích hợp Groq API để sinh nhận xét giáo dục.
Sửa lỗi ImportError và tối ưu cấu trúc hàm.
"""
from groq import AsyncGroq
from typing import List, Dict, Optional
from app.core.config import settings

# Khởi tạo client Groq
client = AsyncGroq(api_key=settings.GROQ_API_KEY)

def _build_single_exam_prompt(
    score: float,
    correct_count: int,
    total_count: int,
    knowledge_stats: List[Dict],
    chapter_stats: List[Dict],
    error_details: Dict,
    subject: str = "Toán"
) -> str:
    """Tạo prompt cho một bài thi duy nhất."""
    error_text = ""
    for kt, topics in error_details.items():
        error_text += f"\n* Các câu làm sai liên quan đến {kt}:\n"
        for topic, stats in topics.items():
            error_text += f"   - {topic} ({stats['wrong']}/{stats['total']})\n"

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
    """Tạo prompt phân tích xu hướng qua nhiều bài thi."""
    history_text = "\n".join([
        f"- Bài {i+1} ({e.get('date', 'N/A')}): {e.get('score', 0):.1f}đ | Tỉ lệ đúng: {e.get('correct_count', 0)}/{e.get('total_count', 0)}"
        for i, e in enumerate(exams_history)
    ])
    
    scores = [e.get('score', 0) for e in exams_history]
    first_score = scores[0] if scores else 0
    last_score = scores[-1] if scores else 0
    trend = "tăng tiến" if last_score > first_score else ("sụt giảm" if last_score < first_score else "ổn định")

    return f"""Bạn là chuyên gia phân tích giáo dục môn {subject}. 
Dựa trên lịch sử {len(exams_history)} bài thi gần nhất, hãy viết báo cáo tiến bộ (khoảng 150-200 từ):

LỊCH SỬ ĐIỂM SỐ:
{history_text}

XU HƯỚNG: {trend} (từ {first_score:.1f}đ -> {last_score:.1f}đ)

YÊU CẦU:
1. Nhận xét về sự thay đổi phong độ của học sinh.
2. Chỉ ra điểm tích cực (ví dụ: sự kiên trì hoặc sự ổn định).
3. Đề xuất chiến lược học tập cụ thể để duy trì hoặc cải thiện kết quả.
Viết giọng điệu chuyên nghiệp, khích lệ và gần gũi."""

def _rule_based_feedback(correct_count: int, total_count: int, error_details: Dict) -> str:
    """Xử lý dự phòng (fallback) khi API lỗi hoặc chưa có Key."""
    error_text = ""
    for kt, topics in error_details.items():
        error_text += f"\n* Bạn cần xem lại {kt}:\n"
        for topic, stats in topics.items():
            error_text += f"   - {topic} ({stats['wrong']}/{stats['total']})\n"
    
    return (
        f"BẠN LÀM ĐÚNG {correct_count}/{total_count}\n"
        f"ĐÁNH GIÁ KIẾN THỨC HỌC SINH\n"
        f"{error_text}\n"
        f"---\n"
        f"NHẬN XÉT: Hệ thống AI đang bảo trì. Bạn hãy dựa vào danh sách câu sai ở trên để ôn tập lại nhé!"
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
    """Hàm chính gọi AI nhận xét một bài thi đơn lẻ."""
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "mock":
        return _rule_based_feedback(correct_count, total_count, error_details)

    try:
        prompt = _build_single_exam_prompt(score, correct_count, total_count, knowledge_stats, chapter_stats, error_details, subject)
        
        completion = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=600
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Lỗi Groq (Single): {e}")
        return _rule_based_feedback(correct_count, total_count, error_details)

async def generate_multi_exam_feedback(
    exams_history: List[Dict],
    subject: str = "Toán"
) -> str:
    """Hàm chính gọi AI phân tích xu hướng tiến bộ."""
    if not exams_history:
        return "Chưa có đủ dữ liệu lịch sử để thực hiện phân tích tiến độ."
        
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "mock":
        return "Hệ thống AI đang bảo trì, vui lòng xem lịch sử điểm số bên dưới."

    try:
        # Sử dụng hàm build prompt đã định nghĩa phía trên
        prompt = _build_multi_exam_prompt(exams_history, subject)
        
        completion = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1000
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Lỗi Groq (Multi): {e}")
        return "Không thể tải nhận xét tiến độ lúc này."