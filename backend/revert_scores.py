import sqlite3
import os

db_path = "quiz_system.db"

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Update scores: multiply by 10 back to 100 scale
# We only multiply scores that are <= 10 to avoid double-multiplying if they already had 100
cursor.execute("UPDATE submissions SET score = score * 10.0 WHERE score <= 10.0")
print(f"Reverted {cursor.rowcount} submission scores back to 100-point scale.")

conn.commit()
conn.close()
print("Done.")
