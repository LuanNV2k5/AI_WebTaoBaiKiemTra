# BÁO CÁO DỰ ÁN: TRẮC NGHIỆM TOÁN HỌC

## 1. TỔNG QUAN DỰ ÁN
**Tên dự án:** Trắc nghiệm Toán học  
**Mục tiêu:** Xây dựng nền tảng web hỗ trợ quản lý ngân hàng câu hỏi, tự động tạo đề thi bằng thuật toán và phân tích kết quả học tập của học sinh.

---

## 2. CÔNG NGHỆ SỬ DỤNG

### 2.1. Backend (Python)
- **FastAPI**: Framework xử lý API tốc độ cao.
- **SQLAlchemy**: Quản lý cơ sở dữ liệu.
- **SQLite**: Lưu trữ dữ liệu ổn định, gọn nhẹ.
- **Google Gemini AI**: Phân tích tiến độ và đưa ra nhận xét cá nhân hóa.
- **Openpyxl**: Xử lý nhập liệu hàng loạt từ file Excel.

### 2.2. Frontend (TypeScript & React)
- **React 18**: Thư viện giao diện người dùng.
- **Vite**: Công cụ build frontend hiện đại.
- **CSS Vanilla**: Giao diện tùy chỉnh, tối ưu trải nghiệm người dùng.

---

## 3. CƠ SỞ DỮ LIỆU
Hệ thống sử dụng **7 bảng dữ liệu** được thiết kế tối ưu:
- **`users`**: Tài khoản người dùng (Admin/Student) và thông tin khối lớp.
- **`knowledge_types`**: Quản lý danh mục kiến thức động (có thể tự thêm/xóa/sửa).
- **`questions`**: Lưu trữ câu hỏi trắc nghiệm (Nội dung, 4 đáp án, giải thích, độ khó...).
- **`exams`**: Quản lý các đề thi đã tạo.
- **`submissions`**: Lưu trữ kết quả bài làm của học sinh (Điểm hệ 100).

---

## 4. TÍNH NĂNG CHÍNH ĐÃ HOÀN THIỆN

### 4.1. Quản lý Ngân hàng câu hỏi & Loại kiến thức
- Admin có thể **nhập hàng nghìn câu hỏi từ Excel** chỉ với một cú click.
- Tự động phân loại câu hỏi theo Khối (10, 11, 12), Chương và Loại kiến thức.
- **Quản lý Loại kiến thức:** Cho phép thay đổi danh mục kiến thức linh hoạt theo nhu cầu giáo dục.

### 4.2. Tạo đề thi thông minh
- Hỗ trợ tạo đề **Tự động** (sử dụng thuật toán di truyền để cân bằng độ khó) và tạo đề **Thủ công** (giáo viên tự chọn câu).
- Tự động căn chỉnh thời gian và số lượng câu hỏi.

### 4.3. Quản lý Học sinh & Phân tích tiến độ
- Danh sách học sinh được sắp xếp khoa học theo **Khối lớp** và **Tên**.
- Dashboard thống kê chi tiết điểm trung bình, xu hướng điểm số qua các bài thi.
- **AI Feedback:** Tự động đưa ra lời khuyên học tập dựa trên những phần kiến thức học sinh còn yếu.

---

## 5. HƯỚNG DẪN CÀI ĐẶT

### Bước 1: Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Bước 2: Frontend
```bash
cd frontend
npm install
npm run dev
```

---
*Báo cáo dự án Trắc nghiệm Toán học – Phiên bản 1.0*
