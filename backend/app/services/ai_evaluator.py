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

    return f"""Bạn là một giáo viên dạy Toán giàu kinh nghiệm, có tâm huyết với nghề sư phạm.
Hãy viết một bản đánh giá kết quả bài thi chi tiết, chuyên nghiệp và đầy tính khích lệ cho học sinh.

KẾT QUẢ CỐT LÕI:
- Điểm số: {score:.1f}/100
- Số câu đúng: {correct_count}/{total_count}

PHÂN TÍCH KIẾN THỨC THEO DỮ LIỆU:
{error_text}

YÊU CẦU ĐÁNH GIÁ (Viết khoảng 200-300 từ, chia thành các phần):
1. **Lời chào và nhận xét chung**: Chúc mừng hoặc động viên học sinh dựa trên điểm số.
2. **Phân tích ưu điểm**: Chỉ ra những phần kiến thức mà học sinh đã nắm vững (dựa trên các câu không nằm trong danh sách sai).
3. **Phân tích nhược điểm**: Giải thích tại sao những phần làm sai lại quan trọng và học sinh đang gặp hổng kiến thức ở đâu.
4. **Lộ trình cải thiện**: Đưa ra 3 bước cụ thể để học sinh ôn tập (ví dụ: xem lại lý thuyết chương X, làm bài tập dạng Y, hỏi giáo viên về Z).
5. **Lời kết**: Một câu truyền cảm hứng để học sinh tiếp tục cố gắng.

Ghi chú: Giọng điệu thân thiện, dùng đại từ 'Thầy/Cô' và 'Em' để tạo cảm giác gần gũi."""


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

    return f"""Bạn là một Chuyên gia Phân tích Dữ liệu Giáo dục cấp cao.
Dựa trên lịch sử {len(exams_history)} bài thi gần nhất của học sinh, hãy viết một BÁO CÁO TIẾN ĐỘ TOÀN DIỆN (khoảng 300-400 từ).

DỮ LIỆU LỊCH SỬ:
{history_text}

TỔNG QUAN XU HƯỚNG: {trend.upper()} (Biến thiên từ {first_score:.1f}đ đến {last_score:.1f}đ)

CẤU TRÚC BÁO CÁO YÊU CẦU:
1. **Phân tích phong độ**: Đánh giá sự ổn định hoặc biến động trong kết quả. Sự thay đổi này phản ánh điều gì trong quá trình học tập?
2. **Điểm sáng nổi bật**: Tìm ra một điểm tích cực nhất trong chuỗi bài làm (ví dụ: sự tiến bộ vượt bậc ở bài cuối, hoặc sự kiên trì duy trì phong độ).
3. **Cảnh báo kiến thức (nếu có)**: Nếu điểm số sụt giảm hoặc đi ngang, hãy chỉ ra rủi ro về mặt kiến thức căn bản.
4. **Chiến lược tối ưu hóa**: Đề xuất phương pháp học tập mang tính hệ thống (ví dụ: phương pháp Spaced Repetition, Active Recall) phù hợp với xu hướng hiện tại.
5. **Thông điệp truyền cảm hứng**: Kết nối các con số với nỗ lực cá nhân của học sinh.

Yêu cầu: Viết một cách chuyên sâu, dùng ngôn từ chuyên môn giáo dục nhưng vẫn giữ được sự gần gũi, khích lệ."""


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

async def generate_ai_questions(
    topic: str,
    grade: int,
    num_questions: int,
    difficulty_distribution: Dict[str, int],  # {"easy": 40, "medium": 40, "hard": 20}
    subject: str = "Toán"
) -> List[Dict]:
    """Sử dụng AI để sinh câu hỏi mới dưới dạng JSON với phân bổ độ khó."""
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "mock":
        raise Exception("AI System is not configured or in mock mode.")

    # Tính toán số lượng từng loại
    easy_count = round(num_questions * difficulty_distribution.get("easy", 40) / 100)
    medium_count = round(num_questions * difficulty_distribution.get("medium", 40) / 100)
    hard_count = num_questions - easy_count - medium_count

    diff_text = f"{easy_count} câu Dễ, {medium_count} câu Trung bình, {hard_count} câu Khó"

    prompt = f"""Bạn là chuyên gia biên soạn đề thi môn {subject} cho học sinh lớp {grade}.
Hãy tạo CHÍNH XÁC {num_questions} câu hỏi trắc nghiệm về chủ đề: "{topic}" với phân bổ độ khó: {diff_text}.

YÊU CẦU VỀ NỘI DUNG:
- NGÔN NGỮ: PHẢI SỬ DỤNG 100% TIẾNG VIỆT (VIETNAMESE). 
- CẤM TUYỆT ĐỐI: Không sử dụng tiếng Nga (Russian), không dùng các từ như "равен", "ответ". 
- Câu hỏi phải phù hợp với chương trình giáo dục phổ thông Việt Nam.
- CÔNG THỨC TOÁN: BẮT BUỘC sử dụng định dạng LaTeX chuẩn, bọc trong cặp dấu $...$ (ví dụ: $\sqrt{{x^2+9}}$, $\frac{{a}}{{b}}$). 
- LƯU Ý QUAN TRỌNG: BẮT BUỘC phải dùng dấu ngoặc nhọn {{...}} sau \sqrt. 
- CẤM TUYỆT ĐỐI: Không được viết $\sqrt x^2+9$, PHẢI viết $\sqrt{{x^2+9}}$.
- Có 4 lựa chọn A, B, C, D.
- Có giải thích chi tiết bằng tiếng Việt tại sao chọn đáp án đó.
- KHÔNG ĐƯỢC tạo thiếu số lượng câu hỏi yêu cầu ({num_questions} câu).

Trả về ĐÚNG định dạng JSON sau. 
LƯU Ý CỰC KỲ QUAN TRỌNG: Trong chuỗi JSON, dấu gạch chéo ngược \ của LaTeX PHẢI ĐƯỢC VIẾT THÀNH HAI DẤU \\ (double backslash) để không bị mất khi parse. 
Ví dụ: Viết "x \\in \\mathbb{{R}}" thay vì "x \in \mathbb{{R}}". Viết "\\sqrt{{x}}" thay vì "\sqrt{{x}}".
{{
  "questions": [
    {{
      "content": "Nội dung câu hỏi...",
      "option_a": "Lựa chọn A",
      "option_b": "Lựa chọn B",
      "option_c": "Lựa chọn C",
      "option_d": "Lựa chọn D",
      "correct_answer": "A", 
      "explanation": "Giải thích chi tiết...",
      "difficulty": 1 (hoặc 2 hoặc 3 tùy theo độ khó câu hỏi đó)
    }}
  ]
}}
"""

    try:
        completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": f"Bạn là máy soạn đề thi Toán chuyên nghiệp. BẮT BUỘC: 100% Tiếng Việt. BẮT BUỘC: Dùng LaTeX chuẩn $\\sqrt{{...}}$ cho mọi căn thức, TUYỆT ĐỐI KHÔNG dùng chữ 'sqrt'. Ví dụ: $\\sqrt{{144}}$. Dùng ký hiệu $...$ cho tất cả biến số và công thức."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.4,
            max_tokens=6000,
            response_format={"type": "json_object"}
        )
        import json
        if not completion.choices or not completion.choices[0].message.content:
            print("Groq API không trả về nội dung.")
            return []

        content = completion.choices[0].message.content
        # Làm sạch chuỗi nếu AI chèn ký tự lạ
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        
        try:
            res_data = json.loads(content)
        except json.JSONDecodeError:
            print(f"Lỗi parse JSON từ AI: {content[:100]}...")
            return []

        # Linh hoạt với các key khác nhau mà AI có thể trả về
        questions = res_data.get("questions") or res_data.get("data")
        if not questions and isinstance(res_data, dict):
            # Nếu AI trả về trực tiếp mảng câu hỏi trong một key nào đó
            for val in res_data.values():
                if isinstance(val, list):
                    questions = val
                    break
        
        if not isinstance(questions, list):
            print(f"Dữ liệu AI trả về không hợp lệ: {res_data}")
            return []
            
        return questions
    except Exception as e:
        print(f"Lỗi sinh câu hỏi AI: {e}")
        return []