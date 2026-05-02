"""Seed dữ liệu mẫu: 2 tài khoản + 60 câu hỏi Toán THPT."""
from app.db.database import SessionLocal, engine
from app.db import models
from app.core.security import get_password_hash

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Xóa dữ liệu cũ
    db.query(models.SubmissionDetail).delete()
    db.query(models.Submission).delete()
    db.query(models.ExamQuestion).delete()
    db.query(models.Exam).delete()
    db.query(models.Question).delete()
    db.query(models.User).delete()
    db.commit()

    # Tạo tài khoản
    admin = models.User(username="admin", email="admin@quizai.vn",
        hashed_password=get_password_hash("123456"), full_name="Admin", role="admin")
    student = models.User(username="hocsinh", email="student@quizai.vn",
        hashed_password=get_password_hash("123456"), full_name="Trần Thị Học", role="student")
    db.add_all([admin, student])
    db.flush()

    questions_data = [
        # ── Chương 1: Hàm số và đồ thị ─────────────────────────────
        ("Hàm số y = f(x) được gọi là hàm số chẵn khi nào?",
         "f(-x) = f(x) với mọi x trong tập xác định",
         "f(-x) = -f(x) với mọi x trong tập xác định",
         "f(x) > 0 với mọi x",
         "f(x) = 0 có nghiệm", "A", 1, 1, "Hàm số và đồ thị", "concept", 1, 50),
        ("Hàm số y = f(x) là hàm số lẻ khi nào?",
         "Tập xác định đối xứng qua O và f(-x) = -f(x)",
         "Tập xác định đối xứng qua O và f(-x) = f(x)",
         "f(x) < 0 với mọi x",
         "f(x) là hàm bậc nhất", "A", 1, 1, "Hàm số và đồ thị", "concept", 1, 50),
        ("Đồ thị hàm số y = x² - 2x + 1 có đỉnh tại điểm nào?",
         "(1, 0)", "(0, 1)", "(-1, 0)", "(2, 1)", "A", 1, 1, "Hàm số và đồ thị", "exercise", 2, 80),
        ("Hàm số y = 2x + 3 đồng biến hay nghịch biến?",
         "Đồng biến trên ℝ", "Nghịch biến trên ℝ",
         "Đồng biến trên (0;+∞)", "Không xác định được", "A", 1, 1, "Hàm số và đồ thị", "theorem", 1, 45),
        ("Chu kỳ của hàm số y = sin(2x) là bao nhiêu?",
         "π", "2π", "π/2", "4π", "A", 1, 2, "Hàm số và đồ thị", "property", 2, 60),
        ("Hàm số nào sau đây là hàm số chẵn?",
         "y = x²", "y = x³", "y = x + 1", "y = sin(x)", "A", 1, 1, "Hàm số và đồ thị", "exercise", 1, 55),
        ("Đồ thị hàm bậc nhất y = ax + b song song với trục Ox khi:",
         "a = 0, b ≠ 0", "a ≠ 0, b = 0", "a = 0, b = 0", "a = b", "A", 1, 1, "Hàm số và đồ thị", "theorem", 1, 45),
        ("Tập xác định của hàm số y = √(x - 1) là:",
         "[1; +∞)", "(1; +∞)", "(-∞; 1]", "ℝ", "A", 1, 2, "Hàm số và đồ thị", "exercise", 1, 60),
        ("Giá trị lớn nhất của hàm số y = -x² + 4x - 3 là:",
         "1", "-3", "4", "3", "A", 1, 2, "Hàm số và đồ thị", "exercise", 2, 90),
        ("Hàm số y = |x| có tính chất gì?",
         "Hàm số chẵn, có đồ thị đối xứng qua trục Oy",
         "Hàm số lẻ",
         "Nghịch biến trên ℝ",
         "Đồng biến trên ℝ", "A", 1, 1, "Hàm số và đồ thị", "property", 1, 50),

        # ── Chương 2: Phương trình và hệ phương trình ───────────────
        ("Phương trình bậc hai ax² + bx + c = 0 có nghiệm khi:",
         "Δ = b² - 4ac ≥ 0", "Δ = b² - 4ac < 0",
         "a > 0", "b = 0", "A", 2, 1, "Phương trình và hệ phương trình", "theorem", 1, 45),
        ("Tổng hai nghiệm của pt x² - 5x + 6 = 0 là:",
         "5", "-5", "6", "-6", "A", 2, 1, "Phương trình và hệ phương trình", "exercise", 1, 60),
        ("Tích hai nghiệm của pt x² - 5x + 6 = 0 là:",
         "6", "-6", "5", "-5", "A", 2, 1, "Phương trình và hệ phương trình", "exercise", 1, 60),
        ("Theo định lý Viète, nếu x₁, x₂ là nghiệm pt ax²+bx+c=0 thì x₁+x₂ bằng:",
         "-b/a", "b/a", "c/a", "-c/a", "A", 2, 1, "Phương trình và hệ phương trình", "theorem", 1, 45),
        ("Phương trình |x - 2| = 3 có tập nghiệm là:",
         "{-1; 5}", "{1; 5}", "{-1; -5}", "{5}", "A", 2, 2, "Phương trình và hệ phương trình", "exercise", 2, 70),
        ("Điều kiện để pt ax² + bx + c = 0 có 2 nghiệm phân biệt:",
         "Δ > 0", "Δ ≥ 0", "Δ = 0", "Δ < 0", "A", 2, 1, "Phương trình và hệ phương trình", "theorem", 1, 40),
        ("Giải hệ: x + y = 5, x - y = 1. Nghiệm là:",
         "(3; 2)", "(2; 3)", "(4; 1)", "(1; 4)", "A", 2, 2, "Phương trình và hệ phương trình", "exercise", 1, 75),
        ("Phương trình 2x - 6 = 0 có nghiệm là:",
         "x = 3", "x = -3", "x = 6", "x = 1/3", "A", 2, 1, "Phương trình và hệ phương trình", "exercise", 1, 40),
        ("Số nghiệm của pt x² + 1 = 0 trong ℝ là:",
         "0", "1", "2", "Vô số", "A", 2, 1, "Phương trình và hệ phương trình", "concept", 1, 40),
        ("Pt x² - 4 = 0 có nghiệm là:",
         "x = ±2", "x = 2", "x = -2", "x = 4", "A", 2, 1, "Phương trình và hệ phương trình", "exercise", 1, 45),

        # ── Chương 3: Bất phương trình ──────────────────────────────
        ("Tập nghiệm của bất phương trình 2x - 4 > 0 là:",
         "(2; +∞)", "(-∞; 2)", "[2; +∞)", "(-∞; 2]", "A", 3, 1, "Bất phương trình", "exercise", 1, 50),
        ("Khi nhân 2 vế BPT với số âm thì chiều BPT:",
         "Đổi chiều", "Giữ nguyên", "Bằng 0", "Không xác định", "A", 3, 1, "Bất phương trình", "theorem", 1, 40),
        ("Tập nghiệm của x² - 3x + 2 < 0 là:",
         "(1; 2)", "(-∞;1)∪(2;+∞)", "[1; 2]", "(0; 3)", "A", 3, 1, "Bất phương trình", "exercise", 2, 80),
        ("BPT |x| < 3 có tập nghiệm là:",
         "(-3; 3)", "(-∞;-3)∪(3;+∞)", "[-3; 3]", "(0; 3)", "A", 3, 2, "Bất phương trình", "exercise", 2, 70),
        ("Bất đẳng thức Cauchy-Schwarz (AM-GM): a + b ≥ ? với a,b ≥ 0:",
         "2√(ab)", "√(ab)", "ab", "2ab", "A", 3, 2, "Bất phương trình", "theorem", 2, 60),

        # ── Chương 4: Hình học phẳng ────────────────────────────────
        ("Diện tích hình tròn bán kính r là:",
         "πr²", "2πr", "πr²/2", "4πr²", "A", 4, 1, "Hình học phẳng", "theorem", 1, 40),
        ("Tổng ba góc trong tam giác bằng:",
         "180°", "360°", "90°", "270°", "A", 4, 1, "Hình học phẳng", "theorem", 1, 35),
        ("Định lý Pitago: trong tam giác vuông tại C thì:",
         "c² = a² + b²", "a² = b² + c²", "b² = a² - c²", "c = a + b", "A", 4, 1, "Hình học phẳng", "theorem", 1, 40),
        ("Diện tích tam giác có đáy a, chiều cao h là:",
         "ah/2", "ah", "a²h", "a/h", "A", 4, 1, "Hình học phẳng", "property", 1, 35),
        ("Chu vi hình tròn bán kính r là:",
         "2πr", "πr²", "πr", "4πr", "A", 4, 1, "Hình học phẳng", "theorem", 1, 35),
        ("Hai tam giác đồng dạng khi:",
         "Các góc tương ứng bằng nhau",
         "Các cạnh tương ứng bằng nhau",
         "Có cùng diện tích",
         "Có cùng chu vi", "A", 4, 1, "Hình học phẳng", "concept", 1, 50),
        ("Trong tam giác đều cạnh a, chiều cao h = ?",
         "a√3/2", "a/2", "a√2/2", "a√3", "A", 4, 2, "Hình học phẳng", "property", 2, 70),
        ("Đường trung bình của tam giác có tính chất:",
         "Song song và bằng nửa cạnh đáy",
         "Vuông góc với cạnh đáy",
         "Bằng cạnh đáy",
         "Đi qua trọng tâm", "A", 4, 1, "Hình học phẳng", "theorem", 1, 50),

        # ── Chương 5: Lượng giác ────────────────────────────────────
        ("Giá trị sin(30°) bằng:",
         "1/2", "√2/2", "√3/2", "1", "A", 5, 1, "Lượng giác", "property", 1, 35),
        ("Giá trị cos(60°) bằng:",
         "1/2", "√3/2", "√2/2", "0", "A", 5, 1, "Lượng giác", "property", 1, 35),
        ("Hệ thức sin²x + cos²x bằng:",
         "1", "0", "2", "sin(2x)", "A", 5, 1, "Lượng giác", "theorem", 1, 30),
        ("Công thức sin(2x) bằng:",
         "2sin(x)cos(x)", "sin²x - cos²x",
         "cos²x - sin²x", "2cos²x - 1", "A", 5, 2, "Lượng giác", "theorem", 2, 60),
        ("Giá trị tan(45°) bằng:",
         "1", "0", "√3", "√2", "A", 5, 1, "Lượng giác", "property", 1, 35),
        ("Phương trình sin(x) = 1/2 có nghiệm tổng quát là:",
         "x = π/6 + 2kπ hoặc x = 5π/6 + 2kπ",
         "x = π/6 + kπ",
         "x = π/3 + 2kπ",
         "x = π/4 + 2kπ", "A", 5, 2, "Lượng giác", "exercise", 2, 90),
        ("cos(180°) bằng:",
         "-1", "1", "0", "√2/2", "A", 5, 1, "Lượng giác", "property", 1, 30),

        # ── Chương 6: Tổ hợp - Xác suất ────────────────────────────
        ("Giai thừa n! được định nghĩa là:",
         "1×2×3×...×n", "n×(n-1)", "nⁿ", "n/2", "A", 6, 1, "Tổ hợp - Xác suất", "concept", 1, 40),
        ("Chỉnh hợp Aₙᵏ = ?",
         "n!/(n-k)!", "n!/k!", "n!/((n-k)!k!)", "n!/(n+k)!", "A", 6, 1, "Tổ hợp - Xác suất", "theorem", 1, 50),
        ("Tổ hợp Cₙᵏ = ?",
         "n!/((n-k)!k!)", "n!/(n-k)!", "n!/k!", "k!/n!", "A", 6, 1, "Tổ hợp - Xác suất", "theorem", 1, 50),
        ("Xác suất của biến cố chắc chắn bằng:",
         "1", "0", "0.5", "∞", "A", 6, 1, "Tổ hợp - Xác suất", "concept", 1, 30),
        ("Tung 1 đồng xu, xác suất ra mặt ngửa là:",
         "1/2", "1/4", "1", "1/3", "A", 6, 1, "Tổ hợp - Xác suất", "exercise", 1, 40),
        ("C₅² = ?",
         "10", "20", "5", "15", "A", 6, 1, "Tổ hợp - Xác suất", "exercise", 1, 50),
        ("Nhị thức Newton: (a+b)² = ?",
         "a² + 2ab + b²", "a² + b²",
         "a² - 2ab + b²", "2a² + 2b²", "A", 6, 1, "Tổ hợp - Xác suất", "theorem", 1, 40),

        # ── Chương 7: Giới hạn và đạo hàm ──────────────────────────
        ("Đạo hàm của hàm số y = xⁿ là:",
         "nxⁿ⁻¹", "nxⁿ", "xⁿ⁻¹", "(n+1)xⁿ", "A", 7, 1, "Giới hạn và đạo hàm", "theorem", 2, 45),
        ("Đạo hàm của y = sin(x) là:",
         "cos(x)", "-cos(x)", "-sin(x)", "tan(x)", "A", 7, 1, "Giới hạn và đạo hàm", "theorem", 2, 40),
        ("Đạo hàm của hàm hằng y = c (c là hằng số) là:",
         "0", "1", "c", "-c", "A", 7, 1, "Giới hạn và đạo hàm", "property", 1, 30),
        ("Đạo hàm của y = eˣ là:",
         "eˣ", "xeˣ", "e", "0", "A", 7, 1, "Giới hạn và đạo hàm", "theorem", 2, 40),
        ("Giới hạn lim(x→∞) (1/x) bằng:",
         "0", "1", "∞", "-1", "A", 7, 1, "Giới hạn và đạo hàm", "concept", 2, 45),
        ("Nếu f'(x₀) = 0 và f''(x₀) < 0 thì x₀ là:",
         "Điểm cực đại", "Điểm cực tiểu",
         "Điểm uốn", "Không xác định được", "A", 7, 2, "Giới hạn và đạo hàm", "theorem", 3, 80),
        ("Đạo hàm của y = ln(x) là:",
         "1/x", "x", "ln(x)/x", "1/ln(x)", "A", 7, 1, "Giới hạn và đạo hàm", "theorem", 2, 40),

        # ── Chương 8: Nguyên hàm - Tích phân ───────────────────────
        ("Nguyên hàm của f(x) = 2x là:",
         "x² + C", "x² ", "2 + C", "2x² + C", "A", 8, 1, "Nguyên hàm - Tích phân", "exercise", 2, 55),
        ("Nguyên hàm của f(x) = cos(x) là:",
         "sin(x) + C", "-sin(x) + C",
         "cos(x) + C", "-cos(x) + C", "A", 8, 1, "Nguyên hàm - Tích phân", "theorem", 2, 45),
        ("∫₀¹ x dx = ?",
         "1/2", "1", "0", "2", "A", 8, 1, "Nguyên hàm - Tích phân", "exercise", 2, 70),
        ("Ý nghĩa hình học của tích phân xác định ∫ₐᵇ f(x)dx là:",
         "Diện tích hình thang cong giới hạn bởi đồ thị y=f(x), trục Ox và x=a, x=b",
         "Độ dài đường cong",
         "Thể tích khối tròn xoay",
         "Chu vi hình phẳng", "A", 8, 1, "Nguyên hàm - Tích phân", "concept", 2, 60),
    ]

    for (content, oa, ob, oc, od, ans, ch, les, ch_name, kt, diff, time_est) in questions_data:
        q = models.Question(
            content=content, option_a=oa, option_b=ob, option_c=oc, option_d=od,
            correct_answer=ans, subject="Toán", chapter=ch, lesson=les,
            chapter_name=ch_name, knowledge_type=kt, difficulty=diff,
            time_estimate=time_est, created_by=admin.id
        )
        db.add(q)

    db.commit()
    print(f"✅ Seed xong: {len(questions_data)} câu hỏi, 2 tài khoản (admin/123456, hocsinh/123456)")

if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    seed()
