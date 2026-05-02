"""Seed câu hỏi Toán lớp 10-11-12 theo chương trình SGK Việt Nam."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, engine
from app.db import models
from app.core.security import get_password_hash

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Lấy admin hoặc tạo mới
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        admin = models.User(username="admin", email="admin@quizai.vn",
            hashed_password=get_password_hash("123456"), full_name="Admin", role="admin")
        db.add(admin)
        db.flush()

    # Xóa đúng thứ tự để tránh lỗi FOREIGN KEY
    from sqlalchemy import text
    db.execute(text("PRAGMA foreign_keys = OFF"))
    db.query(models.SubmissionDetail).delete()
    db.query(models.Submission).delete()
    db.query(models.ExamQuestion).delete()
    db.query(models.Question).delete()
    db.execute(text("PRAGMA foreign_keys = ON"))
    db.commit()

    # (content, A, B, C, D, ans, grade, chapter, chapter_name, type, diff, time)
    questions = [
        # ══ LỚP 10 ══════════════════════════════════════
        # Chương 1: Mệnh đề - Tập hợp
        ("Mệnh đề là:", "Câu khẳng định đúng hoặc sai", "Câu hỏi", "Câu cảm thán", "Mọi phát biểu", "A", 10, 1, "Mệnh đề - Tập hợp", "concept", 1, 40),
        ("Phủ định của mệnh đề 'x > 0' là:", "x ≤ 0", "x < 0", "x = 0", "x ≥ 0", "A", 10, 1, "Mệnh đề - Tập hợp", "concept", 1, 40),
        ("Tập hợp A = {1,2,3,4} có bao nhiêu tập con?", "16", "8", "4", "12", "A", 10, 1, "Mệnh đề - Tập hợp", "exercise", 2, 60),
        ("A ∩ B là tập hợp các phần tử:", "Thuộc cả A và B", "Thuộc A hoặc B", "Thuộc A nhưng không thuộc B", "Không thuộc A và B", "A", 10, 1, "Mệnh đề - Tập hợp", "concept", 1, 35),
        ("Nếu A ⊂ B thì A ∩ B bằng:", "A", "B", "∅", "A ∪ B", "A", 10, 1, "Mệnh đề - Tập hợp", "theorem", 1, 45),

        # Chương 2: Hàm số bậc nhất, bậc hai
        ("Hàm số y = ax + b đồng biến khi:", "a > 0", "a < 0", "b > 0", "a = 0", "A", 10, 2, "Hàm số bậc nhất và bậc hai", "theorem", 1, 35),
        ("Đồ thị hàm số bậc hai y = ax² + bx + c có đỉnh tại x =", "-b/(2a)", "b/(2a)", "-b/a", "b/a", "A", 10, 2, "Hàm số bậc nhất và bậc hai", "theorem", 1, 45),
        ("Parabol y = x² - 4x + 3 cắt trục Ox tại:", "x = 1 và x = 3", "x = -1 và x = 3", "x = 1 và x = -3", "x = 2", "A", 10, 2, "Hàm số bậc nhất và bậc hai", "exercise", 2, 70),
        ("Giá trị nhỏ nhất của y = x² - 6x + 10 là:", "1", "0", "10", "-1", "A", 10, 2, "Hàm số bậc nhất và bậc hai", "exercise", 2, 80),
        ("Hàm số y = -2x + 5 nghịch biến vì:", "Hệ số a = -2 < 0", "b = 5 > 0", "Hàm số âm", "Đây là hàm bậc hai", "A", 10, 2, "Hàm số bậc nhất và bậc hai", "theorem", 1, 40),

        # Chương 3: Phương trình - Hệ phương trình
        ("Δ = b² - 4ac của pt 2x² - 5x + 3 = 0 là:", "1", "-1", "49", "25", "A", 10, 3, "Phương trình bậc hai", "exercise", 1, 60),
        ("Theo Viète: tổng 2 nghiệm của x² - 7x + 12 = 0 là:", "7", "-7", "12", "-12", "A", 10, 3, "Phương trình bậc hai", "theorem", 1, 45),
        ("Tích 2 nghiệm của x² - 7x + 12 = 0 là:", "12", "-12", "7", "-7", "A", 10, 3, "Phương trình bậc hai", "theorem", 1, 45),
        ("Pt |2x - 4| = 6 có nghiệm là:", "x = 5 hoặc x = -1", "x = 5", "x = -1", "Vô nghiệm", "A", 10, 3, "Phương trình bậc hai", "exercise", 2, 70),
        ("Giải hệ: 2x+y=7, x-y=2. Kết quả:", "(3;1)", "(1;3)", "(2;3)", "(3;2)", "A", 10, 3, "Phương trình bậc hai", "exercise", 2, 80),

        # Chương 4: Bất đẳng thức
        ("Bất đẳng thức AM-GM: với a,b ≥ 0 thì a+b ≥?", "2√(ab)", "√(ab)", "ab/2", "(a+b)/2", "A", 10, 4, "Bất đẳng thức - Bất phương trình", "theorem", 2, 50),
        ("Tập nghiệm của 3x - 6 > 0:", "(2;+∞)", "(-∞;2)", "[2;+∞)", "(-∞;2]", "A", 10, 4, "Bất đẳng thức - Bất phương trình", "exercise", 1, 45),
        ("Tập nghiệm của x² - 5x + 6 < 0:", "(2;3)", "(3;+∞)", "(-∞;2)", "(1;6)", "A", 10, 4, "Bất đẳng thức - Bất phương trình", "exercise", 2, 75),

        # Chương 5: Thống kê
        ("Số trung bình cộng của dãy 2,4,6,8,10 là:", "6", "5", "7", "8", "A", 10, 5, "Thống kê", "exercise", 1, 50),
        ("Số trung vị của dãy 1,3,5,7,9 là:", "5", "3", "7", "4", "A", 10, 5, "Thống kê", "exercise", 1, 45),
        ("Phương sai đo lường:", "Độ phân tán của dữ liệu", "Giá trị trung bình", "Giá trị lớn nhất", "Tần số xuất hiện", "A", 10, 5, "Thống kê", "concept", 1, 40),

        # Chương 6: Lượng giác
        ("sin(30°) =", "1/2", "√3/2", "√2/2", "1", "A", 10, 6, "Lượng giác", "property", 1, 30),
        ("cos(60°) =", "1/2", "√3/2", "0", "1", "A", 10, 6, "Lượng giác", "property", 1, 30),
        ("sin²x + cos²x =", "1", "0", "2", "sin(2x)", "A", 10, 6, "Lượng giác", "theorem", 1, 25),
        ("tan(45°) =", "1", "0", "√3", "√3/3", "A", 10, 6, "Lượng giác", "property", 1, 30),
        ("sin(2x) =", "2sin(x)cos(x)", "sin²x - cos²x", "2cos²x - 1", "1 - 2sin²x", "A", 10, 6, "Lượng giác", "theorem", 2, 55),

        # ══ LỚP 11 ══════════════════════════════════════
        # Chương 1: Lượng giác nâng cao
        ("Hàm số y = sin(x) có chu kỳ là:", "2π", "π", "π/2", "4π", "A", 11, 1, "Hàm số lượng giác", "property", 1, 35),
        ("Phương trình sin(x) = 1 có nghiệm:", "x = π/2 + 2kπ", "x = π/2 + kπ", "x = π + 2kπ", "x = 2kπ", "A", 11, 1, "Hàm số lượng giác", "exercise", 2, 60),
        ("Nghiệm tổng quát của cos(x) = 0 là:", "x = π/2 + kπ", "x = kπ", "x = π/2 + 2kπ", "x = π + kπ", "A", 11, 1, "Hàm số lượng giác", "exercise", 2, 60),
        ("Hàm y = tan(x) xác định khi:", "x ≠ π/2 + kπ", "x ≠ kπ", "x ≠ 2kπ", "x ≠ π + kπ", "A", 11, 1, "Hàm số lượng giác", "property", 2, 50),
        ("cos(2x) tính theo cos(x) là:", "2cos²x - 1", "2cos(x) - 1", "cos²x - 1", "1 - cos²x", "A", 11, 1, "Hàm số lượng giác", "theorem", 2, 55),

        # Chương 2: Tổ hợp - Xác suất
        ("C(5,2) =", "10", "20", "5", "15", "A", 11, 2, "Tổ hợp - Xác suất", "exercise", 1, 45),
        ("A(5,2) (chỉnh hợp) =", "20", "10", "5", "25", "A", 11, 2, "Tổ hợp - Xác suất", "exercise", 1, 50),
        ("Xác suất biến cố chắc chắn =", "1", "0", "0.5", "Không xác định", "A", 11, 2, "Tổ hợp - Xác suất", "concept", 1, 25),
        ("Tung 2 đồng xu, xác suất ra 2 mặt ngửa là:", "1/4", "1/2", "1/3", "1/8", "A", 11, 2, "Tổ hợp - Xác suất", "exercise", 2, 60),
        ("C(n,0) + C(n,n) =", "2", "1", "n", "2n", "A", 11, 2, "Tổ hợp - Xác suất", "theorem", 1, 40),

        # Chương 3: Dãy số
        ("Cấp số cộng có công sai d, số hạng tổng quát:", "u₁ + (n-1)d", "u₁ × dⁿ⁻¹", "u₁/d", "nd", "A", 11, 3, "Dãy số - Cấp số cộng - Cấp số nhân", "theorem", 1, 45),
        ("CSC với u₁=2, d=3, số hạng thứ 5 là:", "14", "11", "17", "20", "A", 11, 3, "Dãy số - Cấp số cộng - Cấp số nhân", "exercise", 1, 60),
        ("Cấp số nhân công bội q, số hạng tổng quát:", "u₁ × qⁿ⁻¹", "u₁ + (n-1)q", "u₁/qⁿ", "nq", "A", 11, 3, "Dãy số - Cấp số cộng - Cấp số nhân", "theorem", 1, 45),
        ("CSN với u₁=3, q=2, số hạng thứ 4 là:", "24", "12", "48", "9", "A", 11, 3, "Dãy số - Cấp số cộng - Cấp số nhân", "exercise", 2, 65),

        # Chương 4: Giới hạn
        ("lim(x→2) (x² - 4)/(x - 2) =", "4", "2", "0", "Không tồn tại", "A", 11, 4, "Giới hạn", "exercise", 2, 70),
        ("lim(x→+∞) 1/x =", "0", "1", "+∞", "-∞", "A", 11, 4, "Giới hạn", "concept", 1, 35),
        ("lim(x→0) sin(x)/x =", "1", "0", "+∞", "sin(0)", "A", 11, 4, "Giới hạn", "theorem", 2, 50),

        # Chương 5: Đạo hàm
        ("Đạo hàm của y = x³ là:", "3x²", "x²", "3x³", "x⁴/4", "A", 11, 5, "Đạo hàm", "theorem", 1, 35),
        ("Đạo hàm của y = sin(x) là:", "cos(x)", "-cos(x)", "-sin(x)", "tan(x)", "A", 11, 5, "Đạo hàm", "theorem", 1, 35),
        ("Đạo hàm của y = eˣ là:", "eˣ", "xeˣ", "e", "0", "A", 11, 5, "Đạo hàm", "theorem", 1, 35),
        ("Đạo hàm của y = ln(x) là:", "1/x", "x", "1/ln(x)", "ln(x)/x", "A", 11, 5, "Đạo hàm", "theorem", 1, 35),
        ("Đạo hàm của y = 5 (hằng số) là:", "0", "5", "1", "-5", "A", 11, 5, "Đạo hàm", "property", 1, 25),
        ("Quy tắc đạo hàm tích (uv)' =", "u'v + uv'", "u'v'", "u'v - uv'", "uv", "A", 11, 5, "Đạo hàm", "theorem", 2, 50),
        ("Nếu f'(x₀) = 0 và f''(x₀) > 0 thì x₀ là:", "Cực tiểu", "Cực đại", "Điểm uốn", "Không xác định", "A", 11, 5, "Đạo hàm", "theorem", 2, 55),

        # ══ LỚP 12 ══════════════════════════════════════
        # Chương 1: Khảo sát hàm số
        ("Hàm số đồng biến trên khoảng (a;b) khi f'(x):", "> 0 với mọi x ∈ (a;b)", "< 0 với mọi x ∈ (a;b)", "= 0", "≥ 0", "A", 12, 1, "Khảo sát hàm số", "theorem", 1, 45),
        ("Hàm y = x³ - 3x có cực đại tại x =", "-1", "1", "0", "3", "A", 12, 1, "Khảo sát hàm số", "exercise", 3, 90),
        ("Đường tiệm cận ngang của y = (2x+1)/(x-1) là:", "y = 2", "y = 1", "y = -1", "x = 1", "A", 12, 1, "Khảo sát hàm số", "exercise", 2, 70),
        ("Đường tiệm cận đứng của y = 1/(x-2) là:", "x = 2", "y = 2", "x = 0", "y = 0", "A", 12, 1, "Khảo sát hàm số", "exercise", 1, 50),
        ("Hàm số y = x⁴ - 2x² + 1 có bao nhiêu cực trị:", "3", "2", "1", "0", "A", 12, 1, "Khảo sát hàm số", "exercise", 3, 100),

        # Chương 2: Hàm mũ - Logarit
        ("log₂(8) =", "3", "2", "4", "1", "A", 12, 2, "Hàm mũ - Hàm Logarit", "exercise", 1, 40),
        ("2³ × 2² =", "2⁵", "2⁶", "4⁵", "2", "A", 12, 2, "Hàm mũ - Hàm Logarit", "exercise", 1, 35),
        ("ln(eˣ) =", "x", "e", "ln(x)", "eˣ", "A", 12, 2, "Hàm mũ - Hàm Logarit", "property", 1, 35),
        ("log(ab) = log(a) + log(b) là tính chất:", "Logarit của tích", "Logarit của thương", "Đổi cơ số", "Lũy thừa", "A", 12, 2, "Hàm mũ - Hàm Logarit", "theorem", 1, 40),
        ("Giải phương trình 2ˣ = 8:", "x = 3", "x = 4", "x = 2", "x = 6", "A", 12, 2, "Hàm mũ - Hàm Logarit", "exercise", 1, 50),
        ("Đạo hàm của y = aˣ là:", "aˣ ln(a)", "aˣ", "x·aˣ⁻¹", "ln(a)", "A", 12, 2, "Hàm mũ - Hàm Logarit", "theorem", 2, 50),

        # Chương 3: Nguyên hàm - Tích phân
        ("∫ xⁿ dx (n ≠ -1) =", "xⁿ⁺¹/(n+1) + C", "xⁿ⁻¹/(n-1) + C", "nxⁿ⁻¹ + C", "xⁿ + C", "A", 12, 3, "Nguyên hàm - Tích phân", "theorem", 2, 50),
        ("∫ eˣ dx =", "eˣ + C", "eˣ⁺¹ + C", "xeˣ + C", "e + C", "A", 12, 3, "Nguyên hàm - Tích phân", "theorem", 1, 35),
        ("∫ cos(x) dx =", "sin(x) + C", "-sin(x) + C", "cos(x) + C", "tan(x) + C", "A", 12, 3, "Nguyên hàm - Tích phân", "theorem", 1, 35),
        ("∫₀² 2x dx =", "4", "2", "8", "1", "A", 12, 3, "Nguyên hàm - Tích phân", "exercise", 2, 70),
        ("∫₀¹ (x² + 1) dx =", "4/3", "1", "2", "3/4", "A", 12, 3, "Nguyên hàm - Tích phân", "exercise", 2, 80),
        ("Diện tích hình phẳng giới hạn bởi f(x)≥0, [a,b]:", "∫ₐᵇ f(x)dx", "f(b)-f(a)", "(b-a)f(a)", "f'(x)(b-a)", "A", 12, 3, "Nguyên hàm - Tích phân", "theorem", 1, 45),

        # Chương 4: Số phức
        ("Đơn vị ảo i thỏa mãn:", "i² = -1", "i² = 1", "i = -1", "i = 1", "A", 12, 4, "Số phức", "concept", 1, 30),
        ("Module của số phức z = 3 + 4i là:", "5", "7", "1", "12", "A", 12, 4, "Số phức", "exercise", 2, 60),
        ("Số phức liên hợp của z = 2 + 3i là:", "2 - 3i", "2 + 3i", "-2 + 3i", "-2 - 3i", "A", 12, 4, "Số phức", "concept", 1, 35),
        ("(1 + i)² =", "2i", "2", "-2", "1 + 2i", "A", 12, 4, "Số phức", "exercise", 2, 65),

        # Chương 5: Hình học không gian
        ("Thể tích khối hộp chữ nhật a×b×c:", "abc", "2(ab+bc+ca)", "ab+bc+ca", "abc/3", "A", 12, 5, "Hình học không gian", "theorem", 1, 35),
        ("Thể tích hình cầu bán kính r:", "(4/3)πr³", "4πr²", "(2/3)πr³", "πr³", "A", 12, 5, "Hình học không gian", "theorem", 1, 35),
        ("Thể tích hình nón đáy r, cao h:", "(1/3)πr²h", "πr²h", "(2/3)πr²h", "πrh", "A", 12, 5, "Hình học không gian", "theorem", 1, 35),
        ("Thể tích lăng trụ đứng đáy S, cao h:", "Sh", "Sh/3", "2Sh", "Sh/2", "A", 12, 5, "Hình học không gian", "theorem", 1, 35),
        ("Diện tích toàn phần hình trụ bán kính r, cao h:", "2πr(r+h)", "2πrh", "πr²h", "2πr²+h", "A", 12, 5, "Hình học không gian", "theorem", 2, 50),
    ]

    count = 0
    for row in questions:
        (content, oa, ob, oc, od, ans, grade, ch, ch_name, kt, diff, time_est) = row
        q = models.Question(
            content=content, option_a=oa, option_b=ob, option_c=oc, option_d=od,
            correct_answer=ans, subject="Toán", grade=grade,
            chapter=ch, lesson=1, chapter_name=ch_name,
            knowledge_type=kt, difficulty=diff,
            time_estimate=time_est, created_by=admin.id
        )
        db.add(q)
        count += 1

    db.commit()
    print(f"✅ Đã thêm {count} câu hỏi Toán 10-11-12 vào database!")
    db.close()

if __name__ == "__main__":
    seed()
