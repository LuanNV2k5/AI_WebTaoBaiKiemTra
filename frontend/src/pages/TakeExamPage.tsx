import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examsApi, submissionsApi } from '../services/api';
import { Exam, Question } from '../types';
import '../index.css';

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
    } catch { 
      alert('Lỗi nộp bài!'); 
      setSubmitting(false); 
    }
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
  }, [started, exam, handleSubmit]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-gray)', marginTop: '1rem' }}>Đang tải đề thi...</p>
    </div>
  );
  
  if (!exam) return (
    <div className="te-start-wrapper fade-in">
      <div className="te-start-card" style={{ border: '1px solid var(--jasper)', background: 'var(--jasper-fade)' }}>
        <h3 style={{ color: 'var(--jasper)' }}>Không tìm thấy đề thi.</h3>
      </div>
    </div>
  );

  // --- MÀN HÌNH BẮT ĐẦU ---
  if (!started) {
    return (
      <div className="te-start-wrapper fade-in">
        <div className="te-start-card">
          <div className="te-start-icon">📝</div>
          <h2 className="te-start-title">{exam.title}</h2>
          <p className="text-secondary">{exam.description}</p>
          
          <div className="te-stat-group">
            <div className="te-stat-box">
              <div className="te-stat-val">{exam.total_questions}</div>
              <div className="te-stat-lbl">Câu hỏi</div>
            </div>
            <div className="te-stat-box">
              <div className="te-stat-val" style={{ color: '#f59e0b' }}>{exam.time_limit}</div>
              <div className="te-stat-lbl">Phút</div>
            </div>
          </div>
          
          <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'left', marginBottom: '1.5rem', borderLeft: '4px solid #0284c7' }}>
            <strong>Lưu ý:</strong> Hãy hoàn thành bài trước khi hết giờ. Hệ thống sẽ tự động thu bài khi thời gian đếm ngược kết thúc.
          </div>
          
          <button className="te-btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '14px' }} onClick={() => setStarted(true)}>
            🚀 Bắt đầu làm bài
          </button>
        </div>
      </div>
    );
  }

  // Màn hình lỗi nếu đề chưa có câu hỏi
  if (exam.questions.length === 0) {
    return (
      <div className="te-start-wrapper fade-in">
        <div className="te-start-card">
          <div className="te-start-icon">⚠️</div>
          <h3 style={{ marginBottom: '1rem' }}>Đề thi chưa có câu hỏi</h3>
          <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Vui lòng liên hệ Giáo viên/Admin để cập nhật nội dung đề thi.</p>
          <button className="te-btn-outline" onClick={() => navigate('/exams')}>Quay lại danh sách</button>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN LÀM BÀI CHÍNH ---
  const q = exam.questions[currentIdx];
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const isDanger = timeLeft < 300; // Đỏ khi còn dưới 5 phút
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      
      {/* Top bar (Sticky) */}
      <div className="te-topbar">
        <div className="te-topbar-info">
          <span className="te-topbar-title">{exam.title}</span>
          <span className="te-topbar-progress">Tiến độ: Đã làm {Object.keys(answers).length}/{exam.total_questions} câu</span>
        </div>
        <div className={`te-timer ${isDanger ? 'danger' : ''}`}>
          ⏱ {mm}:{ss}
        </div>
        <button className="te-btn-submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Đang nộp...' : 'Nộp bài ngay'}
        </button>
      </div>

      {/* Main Layout */}
      <div className="te-layout fade-in">
        
        {/* Khung bên trái: Câu hỏi & Đáp án */}
        <div className="te-main">
          <div className="te-q-card">
            <div className="te-q-header">
              <span className="exam-badge-grade" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                Câu hỏi {currentIdx + 1}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className={`score-badge ${q.difficulty === 1 ? 'score-good' : q.difficulty === 2 ? 'score-avg' : 'score-bad'}`}>
                  {q.difficulty === 1 ? 'Mức độ: Dễ' : q.difficulty === 2 ? 'Mức độ: Vừa' : 'Mức độ: Khó'}
                </span>
                <span className="score-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                  {q.chapter_name || `Chương ${q.chapter}`}
                </span>
              </div>
            </div>
            
            <p className="te-q-text">{q.content}</p>

            <div className="te-opt-list">
              {opts.map((opt, i) => {
                const letter = LETTERS[i];
                const isSelected = answers[String(q.id)] === letter;
                return (
                  <div 
                    key={i} 
                    className={`te-opt-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setAnswers(a => ({ ...a, [String(q.id)]: letter }))}
                  >
                    <div className="te-opt-letter">{letter}</div>
                    <span className="te-opt-text">{opt}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Buttons Previous / Next */}
            <div className="te-nav-actions">
              <button className="te-btn-outline" onClick={() => setCurrentIdx(i => i - 1)} disabled={currentIdx === 0}>
                &laquo; Câu trước
              </button>
              
              {currentIdx < exam.total_questions - 1 ? (
                <button className="te-btn-primary" onClick={() => setCurrentIdx(i => i + 1)}>
                  Câu tiếp &raquo;
                </button>
              ) : (
                <button className="te-btn-submit" onClick={handleSubmit} disabled={submitting}>
                  Hoàn tất & Nộp bài
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Khung bên phải: Bảng số câu (Sidebar) */}
        <div className="te-sidebar">
          <div className="te-q-card" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1.25rem 0', color: 'var(--text-dark)' }}>Danh sách câu hỏi</h4>
            
            <div className="te-nav-grid">
              {exam.questions.map((qItem, i) => {
                const isCurrent = i === currentIdx;
                const isAnswered = !!answers[String(qItem.id)];
                let btnClass = 'te-nav-btn';
                if (isCurrent) btnClass += ' current';
                else if (isAnswered) btnClass += ' answered';
                
                return (
                  <button key={i} className={btnClass} onClick={() => setCurrentIdx(i)}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '1.5rem 0' }} />
            
            <div className="te-legend">
              <div className="te-legend-item">
                <div className="te-box-current" /> Đang chọn
              </div>
              <div className="te-legend-item">
                <div className="te-box-answered" /> Đã trả lời
              </div>
              <div className="te-legend-item">
                <div className="te-box-empty" /> Chưa trả lời
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}