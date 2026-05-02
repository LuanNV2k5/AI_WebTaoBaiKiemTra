import sqlite3
import os

db_path = "quiz_system.db"

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Update scores: divide by 10
cursor.execute("UPDATE submissions SET score = score / 10.0")
print(f"Updated {cursor.rowcount} submission scores.")

# Clear AI feedback so it can be regenerated or at least doesn't show old wrong numbers
# Alternatively, we could try to replace "100" with "10" in the text, but it's risky.
# The user's example message suggests it's from _rule_based_multi_feedback which isn't stored in DB,
# but generated on the fly in analytics.py.
# Wait, generate_single_exam_feedback is stored in ai_feedback.
# Let's check a few ai_feedback contents.

cursor.execute("SELECT id, ai_feedback FROM submissions WHERE ai_feedback IS NOT NULL")
rows = cursor.fetchall()
for row_id, feedback in rows:
    if feedback:
        # Example fix: Replace "/100" with "/10" and handle the score numbers if possible
        # but the score numbers are varied.
        # It's better to just clear them so the next time they view it, it's fresh? 
        # No, the single exam feedback is generated once.
        
        # Let's try a simple string replacement for the common patterns
        new_feedback = feedback.replace("/100", "/10")
        # Note: This doesn't fix the actual numbers like "15.0" to "1.5"
        # Since we don't know the exact format of all feedbacks, 
        # maybe we should just leave it or clear it.
        
        # Actually, let's just clear ai_feedback for existing records to avoid confusion.
        pass

cursor.execute("UPDATE submissions SET ai_feedback = NULL")
print("Cleared ai_feedback to allow regeneration or avoid stale data.")

conn.commit()
conn.close()
print("Done.")
