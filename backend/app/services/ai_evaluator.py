"""
AI Evaluator – Tích hợp Groq API để sinh nhận xét giáo dục và hệ thống Multi-Agent tạo câu hỏi.
"""
import json
from groq import AsyncGroq
from typing import List, Dict, Optional
from app.core.config import settings

# Khởi tạo client Groq
client = AsyncGroq(api_key=settings.GROQ_API_KEY)

# =====================================================================
# PHẦN 1: CÁC HÀM XÂY DỰNG PROMPT NHẬN XÉT HỌC TẬP
# =====================================================================

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

    return f"""Bạn là một giáo viên dạy {subject} giàu kinh nghiệm, có tâm huyết với nghề sư phạm.
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
4. **Lộ trình cải thiện**: Đưa ra 3 bước cụ thể để học sinh ôn tập.
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
1. **Phân tích phong độ**: Đánh giá sự ổn định hoặc biến động.
2. **Điểm sáng nổi bật**: Tìm ra một điểm tích cực nhất trong chuỗi bài làm.
3. **Cảnh báo kiến thức (nếu có)**: Nếu điểm số sụt giảm hoặc đi ngang, hãy chỉ ra rủi ro.
4. **Chiến lược tối ưu hóa**: Đề xuất phương pháp học tập mang tính hệ thống.
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

# =====================================================================
# PHẦN 2: CHỨC NĂNG NHẬN XÉT BÀI THI (FEEDBACK AI)
# =====================================================================

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

# =====================================================================
# PHẦN 3: HỆ THỐNG MULTI-AGENT SINH VÀ DUYỆT ĐỀ THI
# =====================================================================

async def _verify_questions_batch(questions: List[Dict], subject: str, grade: int) -> List[Dict]:
    """Agent 2 (Tổ trưởng): Kiểm duyệt một mảng câu hỏi cùng lúc bằng Chain-of-Thought."""
    questions_json = json.dumps(questions, ensure_ascii=False, indent=2)
    
    prompt = f"""Bạn là Tổ trưởng chuyên môn môn {subject} khối {grade}.
Dưới đây là {len(questions)} câu hỏi trắc nghiệm Toán học do một giáo viên tập sự soạn (định dạng JSON).
Nhiệm vụ của bạn là kiểm duyệt khắt khe TỪNG câu hỏi một.

QUY TRÌNH KIỂM DUYỆT (TƯ DUY LOGIC):
1. Giải nháp: Bạn PHẢI tự giải bài toán để tìm ra đáp án đúng.
2. Đối chiếu: So sánh đáp án của bạn với 'correct_answer' của giáo viên tập sự.
3. Kiểm tra LaTeX: Công thức Toán CÓ ĐƯỢC bọc trong $...$ và chuẩn escape kép (ví dụ: \\\\sqrt) chưa?

LƯU Ý: Trường "status" chỉ được phép mang giá trị "pass" hoặc "fail". TUYỆT ĐỐI KHÔNG thêm chú thích vào file JSON.

BẮT BUỘC trả về JSON theo đúng định dạng sau. Phải trả về đúng {len(questions)} phần tử trong mảng "evaluations", tương ứng với thứ tự (index) của câu hỏi đầu vào:
{{
    "evaluations": [
        {{
            "index": 0,
            "reasoning": "Bước 1... Bước 2... => Đáp án đúng là B. Tác giả chọn B. LaTeX chuẩn.",
            "status": "pass"
        }},
        {{
            "index": 1,
            "reasoning": "Phương trình vô nghiệm, nhưng đáp án của tác giả lại ra A. Sai Toán học.",
            "status": "fail"
        }}
    ]
}}

NỘI DUNG CẦN KIỂM DUYỆT:
{questions_json}
"""
    try:
        completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "Bạn là máy chấm lỗi logic Toán học khắt khe. Trả về đúng JSON. Tư duy logic 100%, không sáng tạo."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.0, 
            max_tokens=6000,
            response_format={"type": "json_object"}
        )
        content = completion.choices[0].message.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        
        eval_data = json.loads(content)
        return eval_data.get("evaluations", [])
    except Exception as e:
        print(f"Lỗi Agent kiểm duyệt: {e}")
        return []

async def generate_ai_questions(
    topic: str,
    grade: int,
    num_questions: int,
    difficulty_distribution: Dict[str, int],
    subject: str = "Toán"
) -> List[Dict]:
    """Agent 1 (Người soạn): Sinh câu hỏi đệm -> Giao cho Agent 2 kiểm duyệt -> Trả về kết quả sạch."""
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "mock":
        raise Exception("AI System is not configured or in mock mode.")

    # 1. CHIẾN THUẬT SINH ĐỆM (OVER-GENERATION)
    buffer_count = max(3, int(num_questions * 0.5)) 
    target_generate_count = num_questions + buffer_count

    easy_count = round(target_generate_count * difficulty_distribution.get("easy", 40) / 100)
    medium_count = round(target_generate_count * difficulty_distribution.get("medium", 40) / 100)
    hard_count = target_generate_count - easy_count - medium_count

    diff_text = f"{easy_count} câu Dễ, {medium_count} câu Trung bình, {hard_count} câu Khó"

    prompt = f"""Bạn là một Chuyên gia biên soạn đề thi môn {subject} cấp Quốc gia, am hiểu sâu sắc chương trình giáo dục phổ thông mới của Việt Nam cho học sinh lớp {grade}.
Nhiệm vụ của bạn là thiết kế CHÍNH XÁC {target_generate_count} câu hỏi trắc nghiệm xuất sắc về chủ đề: "{topic}".

PHÂN BỔ ĐỘ KHÓ YÊU CẦU: {diff_text}
- Dễ (Mức 1): Nhận biết, nhớ công thức, áp dụng cơ bản 1 bước.
- Trung bình (Mức 2): Thông hiểu, cần tư duy logic 2-3 bước, biến đổi phương trình/công thức.
- Khó (Mức 3): Vận dụng cao, bài toán tổng hợp, đòi hỏi tư duy sâu sắc, có nhiều bẫy logic.

YÊU CẦU SƯ PHẠM (CHẤT LƯỢNG CÂU HỎI):
1. Phương án nhiễu (Đáp án sai): PHẢI LÀ các lỗi sai phổ biến của học sinh (ví dụ: quên đổi dấu, quên xét điều kiện xác định, nhớ nhầm công thức). Tuyệt đối không cho các đáp án sai ngớ ngẩn, vô lý.
2. Đa dạng: Các câu hỏi phải bao quát nhiều khía cạnh của chủ đề, không lặp lại một form bài tập.
3. Giải thích (Explanation): Phải giải chi tiết từng bước (Step-by-step). Nếu có bẫy, phải chỉ rõ tại sao học sinh hay chọn sai đáp án đó.

YÊU CẦU KỸ THUẬT VÀ ĐỊNH DẠNG (LUẬT SINH TỬ):
1. NGÔN NGỮ: 100% Tiếng Việt chuẩn mực. Cấm dùng từ ngữ nước ngoài (như "равен", "ответ") hay tiếng Anh pha trộn.
2. TOÁN HỌC & LATEX: 
   - MỌI công thức, phân số, căn thức, phương trình, hệ phương trình, số liệu phức tạp hay ký hiệu biến số (x, y, m, a, b...) ĐỀU PHẢI được bọc trong cặp dấu $...$.
   - BẮT BUỘC sử dụng ngoặc nhọn {{...}} sau lệnh căn. Viết $\\sqrt{{x+1}}$ thay vì $\\sqrt x+1$.
3. JSON ESCAPING (CỰC KỲ QUAN TRỌNG):
   - Vì bạn trả về chuỗi JSON, MỌI dấu gạch chéo ngược (\) của LaTeX BẮT BUỘC PHẢI escape thành hai dấu (\\\\).
   - Sai: $\sqrt{{x}}$, $\frac{{1}}{{2}}$, $x \in \mathbb{{R}}$
   - Đúng: $\\\\sqrt{{x}}$, $\\\\frac{{1}}{{2}}$, $x \\\\in \\\\mathbb{{R}}$

BẮT BUỘC trả về ĐÚNG định dạng JSON theo mẫu cực chuẩn sau đây (Không giải thích thêm, chỉ xuất JSON):
{{
  "questions": [
    {{
      "content": "Tìm tất cả các giá trị của tham số $m$ để phương trình $\\\\sqrt{{x^2 - 4}} = m$ có nghiệm thực.",
      "option_a": "$m > 0$",
      "option_b": "$m \\\\ge 0$",
      "option_c": "$m = 0$",
      "option_d": "$m \\\\in \\\\mathbb{{R}}$",
      "correct_answer": "B", 
      "explanation": "Điều kiện xác định: $x^2 - 4 \\\\ge 0 \\\\Leftrightarrow |x| \\\\ge 2$. Ta có vế trái là một căn bậc hai số học nên $\\\\sqrt{{x^2 - 4}} \\\\ge 0$ với mọi $x$ thỏa mãn điều kiện. Do đó, để phương trình có nghiệm thì vế phải cũng phải không âm, tức là $m \\\\ge 0$. (Đáp án A sai do thiếu trường hợp bằng 0, đáp án D sai do chưa xét tính không âm của căn).",
      "difficulty": 3
    }}
  ]
}}
"""
    try:
        # --- BƯỚC 1: GỌI AGENT 1 SINH CÂU HỎI ---
        print(f"\n[AGENT 1] Đang sinh {target_generate_count} câu hỏi (bao gồm {buffer_count} câu dự phòng)...")
        completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "Bạn là chuyên gia giáo dục xuất sắc và là máy sinh dữ liệu JSON. Chỉ xuất JSON hợp lệ, định dạng LaTeX cực chuẩn (escape double backslash), đáp án nhiễu phải cực kỳ logic và thông minh."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.5, 
            max_tokens=6000,
            response_format={"type": "json_object"}
        )
        content = completion.choices[0].message.content
        
        # In ra để bạn dễ debug
        print("\n=== KẾT QUẢ JSON TỪ AGENT 1 ===")
        print(content)
        print("===============================\n")

        # Xử lý cắt chuỗi an toàn
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        
        try:
            res_data = json.loads(content)
        except json.JSONDecodeError as jde:
            print(f"Lỗi parse JSON từ Agent 1: {jde}")
            print(f"Nội dung thô: {content[:200]}...")
            return []

        raw_questions = res_data.get("questions") or res_data.get("data")
        
        # Xử lý trường hợp AI trả về mảng lồng trong một key bất kỳ
        if not raw_questions and isinstance(res_data, dict):
            for val in res_data.values():
                if isinstance(val, list):
                    raw_questions = val
                    break
                    
        if not isinstance(raw_questions, list):
            print("Dữ liệu AI sinh ra không phải là một danh sách (list).")
            return []

        # --- BƯỚC 2: GIAO CHO AGENT 2 KIỂM DUYỆT TOÀN BỘ (BATCH EVALUATION) ---
        print(f"[AGENT 2] Đang kiểm duyệt tính chính xác của lô {len(raw_questions)} câu hỏi...")
        evaluations = await _verify_questions_batch(raw_questions, subject, grade)
        
        # --- BƯỚC 3: LỌC KẾT QUẢ ---
        passed_questions = []
        for i, q in enumerate(raw_questions):
            # Tìm tờ phiếu kiểm duyệt của câu hỏi thứ i
            eval_result = next((e for e in evaluations if e.get("index") == i), None)
            
            if eval_result and eval_result.get("status") == "pass":
                passed_questions.append(q)
            else:
                reason = eval_result.get('reasoning', 'Lỗi không xác định') if eval_result else 'Lỗi parse JSON'
                print(f"❌ Xóa bỏ câu {i+1}. Lý do Tổ trưởng AI đưa ra: {reason}")
                
        print(f"[TỔNG KẾT] Số câu đạt chuẩn xuất sắc: {len(passed_questions)}/{len(raw_questions)}")
        
        # --- BƯỚC 4: TRẢ KẾT QUẢ CHO ROUTER/WEB ---
        final_questions = passed_questions[:num_questions]
        return final_questions

    except Exception as e:
        print(f"Lỗi hệ thống Multi-Agent: {e}")
        return []