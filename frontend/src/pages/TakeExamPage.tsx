import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examsApi, submissionsApi } from '../services/api';
import { Exam, Question } from '../types';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function TakeExamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const startTime = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    examsApi.get(Number(id)).then(r => {
      setExam(r.data);
      setTimeLeft(r.data.time_limit * 60);
    }).catch(() => alert('Không tìm thấy đề thi')).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const res = await submissionsApi.submit({
        exam_id: exam.id,
        answers,
        time_spent: Math.floor((Date.now() - startTime.current) / 1000)
      });
      navigate(`/result/${res.data.id}`);
    } catch { alert('Lỗi nộp bài!'); setSubmitting(false); }
  }, [exam, answers, submitting, navigate]);

  useEffect(() => {
    if (!started || !exam) return;
    startTime.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started]);

  if (loading) return <div className="loading-center"><div className="spinner"/></div>;
  if (!exam) return <div className="page"><div className="alert alert-danger">Không tìm thấy đề thi.</div></div>;

  if (!started) {
    return (
      <div className="page flex-center fade-in" style={{ flexDirection: 'column', gap: '2rem' }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
          <h2 style={{ marginBottom: '0.5rem' }}>{exam.title}</h2>
          <p className="text-secondary mb-3">{exam.description}</p>
          <div className="grid-2 mb-3" style={{ gap: '0.75rem' }}>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div className="stat-value text-accent">{exam.total_questions}</div>
              <div className="stat-label">Câu hỏi</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div className="stat-value text-warning">{exam.time_limit}</div>
              <div className="stat-label">Phút</div>
            </div>
          </div>
          <div className="alert alert-info" style={{ textAlign: 'left', fontSize: '0.85rem' }}>
            ⚠️ Hãy trả lời tất cả câu hỏi trước khi hết giờ. Bài sẽ tự động nộp khi hết thời gian.
          </div>
          <button className="btn btn-primary btn-lg w-full" onClick={() => setStarted(true)}>
            🚀 Bắt đầu làm bài
          </button>
        </div>
      </div>
    );
  }
  if (exam.questions.length === 0) {
    return (
      <div className="page flex-center fade-in">
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h3>⚠️ Đề thi chưa có câu hỏi</h3>
          <p className="text-secondary">Vui lòng liên hệ Admin để cập nhật nội dung đề thi.</p>
          <button className="btn btn-secondary mt-3" onClick={() => navigate('/exams')}>Quay lại</button>
        </div>
      </div>
    );
  }

  const q = exam.questions[currentIdx];
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const isDanger = timeLeft < 300;
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div>
          <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{exam.title}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Câu {currentIdx + 1}/{exam.total_questions}</div>
        </div>
        <div className={`timer ${isDanger ? 'danger' : ''}`}>
          [Thời gian] {mm}:{ss}
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Đang nộp...' : '[Nộp bài]'}
        </button>
      </div>

      <div className="page" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.5rem', paddingTop: '1.5rem' }}>
        {/* Question area */}
        <div className="fade-in" key={currentIdx}>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="flex-between mb-2">
              <span className="badge badge-accent">Câu {currentIdx + 1}</span>
              <div className="flex gap-1">
                <span className={`badge diff-${q.difficulty}`}>{q.difficulty === 1 ? 'Dễ' : q.difficulty === 2 ? 'Trung bình' : 'Khó'}</span>
                <span className="badge badge-muted">{q.chapter_name || `Chương ${q.chapter}`}</span>
              </div>
            </div>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.7, fontWeight: 500 }}>{q.content}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {opts.map((opt, i) => {
              const letter = LETTERS[i];
              const isSelected = answers[String(q.id)] === letter;
              return (
                <div key={i} className={`answer-option${isSelected ? ' selected' : ''}`}
                  onClick={() => setAnswers(a => ({ ...a, [String(q.id)]: letter }))}>
                  <div className="answer-letter">{letter}</div>
                  <span style={{ flex: 1, lineHeight: 1.6 }}>{opt}</span>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex-between mt-3">
            <button className="btn btn-secondary" onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0}>
              &laquo; Câu trước
            </button>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>{Object.keys(answers).length}/{exam.total_questions} đã trả lời</span>
            {currentIdx < exam.total_questions - 1 ? (
              <button className="btn btn-primary" onClick={() => setCurrentIdx(i => i + 1)}>
                Câu tiếp &raquo;
              </button>
            ) : (
              <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
                [Nộp bài]
              </button>
            )}
          </div>
        </div>

        {/* Question navigator */}
        <div>
          <div className="card">
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Bảng câu hỏi</h4>
            <div className="q-nav">
              {exam.questions.map((_, i) => (
                <button key={i} className={`q-nav-btn ${i === currentIdx ? 'current' : answers[String(exam.questions[i].id)] ? 'answered' : ''}`}
                  onClick={() => setCurrentIdx(i)}>{i + 1}</button>
              ))}
            </div>
            <hr className="divider" />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 16, height: 16, background: 'var(--accent)', borderRadius: 4 }} /> Câu hiện tại
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 16, height: 16, background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 4 }} /> Đã trả lời
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 16, height: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4 }} /> Chưa trả lời
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
