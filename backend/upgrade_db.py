import sqlite3

def upgrade():
    conn = sqlite3.connect('quiz_system.db')
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN grade INTEGER")
        # Update existing students to grade 10, admins to NULL
        cursor.execute("UPDATE users SET grade = 10 WHERE role = 'student'")
        print("✅ Thêm cột grade vào bảng users thành công.")
    except sqlite3.OperationalError as e:
        print(f"Bảng users có thể đã được update: {e}")

    try:
        cursor.execute("ALTER TABLE questions ADD COLUMN grade INTEGER DEFAULT 10")
        print("✅ Thêm cột grade vào bảng questions thành công.")
    except sqlite3.OperationalError as e:
        print(f"Bảng questions có thể đã được update: {e}")

    try:
        cursor.execute("ALTER TABLE exams ADD COLUMN grade INTEGER DEFAULT 10")
        print("✅ Thêm cột grade vào bảng exams thành công.")
    except sqlite3.OperationalError as e:
        print(f"Bảng exams có thể đã được update: {e}")

    conn.commit()
    conn.close()
    print("Hoàn tất cập nhật Database!")

if __name__ == "__main__":
    upgrade()
