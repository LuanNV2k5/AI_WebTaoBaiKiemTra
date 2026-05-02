import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { submissionsApi } from '../services/api';
import { Submission } from '../types';

const LETTERS = ['A', 'B', 'C', 'D'];
const KT_NAMES: Record<string, string> = { concept: 'Khái niệm', theorem: 'Định lý', property: 'Tính chất', exercise: 'Dạng bài tập' };

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)';
  const r = 54, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={70} cy={70} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, color }}>{score.toFixed(0)}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ 100</span>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const [sub, setSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    submissionsApi.get(Number(id)).then(r => setSub(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-center"><div className="spinner" /><p className="text-secondary">Đang tải kết quả...</p></div>;
  if (!sub) return <div className="page"><div className="alert alert-danger">Không tìm thấy kết quả.</div></div>;

  const correct = sub.details.filter(d => d.is_correct).length;
  const mins = String(Math.floor(sub.time_spent / 60)).padStart(2, '0');
  const secs = String(sub.time_spent % 60).padStart(2, '0');

  // Knowledge breakdown
  const ktMap: Record<string, { c: number; t: number }> = {};
  sub.details.forEach(d => {
    const kt = d.question.knowledge_type;
    if (!ktMap[kt]) ktMap[kt] = { c: 0, t: 0 };
    ktMap[kt].t++;
    if (d.is_correct) ktMap[kt].c++;
  });

  const display = showAll ? sub.details : sub.details.slice(0, 5);

  return (
    <div className="page fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>🎉 Kết quả bài thi</h1>
      <p className="text-secondary mb-3">Xem chi tiết kết quả và nhận xét từ AI</p>

      {/* Score + stats */}
      <div className="grid-2 mb-3" style={{ alignItems: 'start' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <ScoreRing score={sub.score} />
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>{sub.score >= 80 ? '🏆 Xuất sắc!' : sub.score >= 60 ? '👍 Khá tốt' : '📚 Cần ôn thêm'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span className="badge badge-success">✓ {correct} câu đúng</span>
              <span className="badge badge-danger">✗ {sub.details.length - correct} câu sai</span>
              <span className="badge badge-muted">⏱ {mins}:{secs} làm bài</span>
            </div>
          </div>
        </div>

        {/* Knowledge breakdown */}
        <div className="card">
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 Theo loại kiến thức
          </h4>
          {Object.entries(ktMap).map(([kt, v]) => (
            <div key={kt} style={{ marginBottom: '0.75rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.85rem' }}>{KT_NAMES[kt] || kt}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{v.c}/{v.t} ({Math.round(v.c/v.t*100)}%)</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${v.c/v.t*100}%`, background: v.c/v.t >= 0.7 ? 'var(--success)' : v.c/v.t >= 0.5 ? 'var(--warning)' : 'var(--danger)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Feedback - Đánh giá chi tiết theo mẫu */}
      {sub.ai_feedback && (
        <div className="card mb-3" style={{ borderLeft: '5px solid var(--green-main)', background: '#f9fdf9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--green-dark)' }}>📊 ĐÁNH GIÁ KIẾN THỨC CHI TIẾT</h3>
            <span className="badge badge-success">AI Evaluator</span>
          </div>
          <div style={{ 
            lineHeight: 1.8, 
            color: 'var(--text-primary)', 
            whiteSpace: 'pre-line',
            padding: '1rem',
            background: '#fff',
            borderRadius: 'var(--radius)',
            border: '1px solid #e0eee0',
            fontSize: '0.95rem'
          }}>
            {sub.ai_feedback}
          </div>
        </div>
      )}

      {/* Question details */}
      <div className="card">
        <div className="flex-between mb-3">
          <h3>📖 Chi tiết từng câu</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? '[Thu gọn]' : `[Xem tất cả (${sub.details.length})]`}
          </button>
        </div>

        {display.map((d, i) => {
          const isOpen = expanded.has(d.question_id);
          const opts = [d.question.option_a, d.question.option_b, d.question.option_c, d.question.option_d];
          return (
            <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div className="flex-between" style={{ cursor: 'pointer' }} onClick={() => setExpanded(s => { const n = new Set(s); isOpen ? n.delete(d.question_id) : n.add(d.question_id); return n; })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {d.is_correct ? <span style={{ color: 'var(--success)' }}>✓</span> : <span style={{ color: 'var(--danger)' }}>✗</span>}
                  <span style={{ fontWeight: 500 }}>Câu {i + 1}: {d.question.content.slice(0, 70)}{d.question.content.length > 70 ? '...' : ''}</span>
                </div>
                {isOpen ? '[↑]' : '[↓]'}
              </div>
              {isOpen && (
                <div style={{ marginTop: '0.75rem', paddingLeft: '2rem' }}>
                  {opts.map((opt, j) => {
                    const letter = LETTERS[j];
                    const isCorrect = letter === d.question.correct_answer;
                    const isUser = letter === d.user_answer;
                    return (
                      <div key={j} className={`answer-option disabled ${isCorrect ? 'correct' : isUser && !isCorrect ? 'wrong' : ''}`} style={{ marginBottom: '0.4rem', padding: '0.6rem 1rem' }}>
                        <div className="answer-letter">{letter}</div>
                        <span style={{ flex: 1, fontSize: '0.9rem' }}>{opt}</span>
                        {isCorrect && <span className="badge badge-success">✓ Đáp án đúng</span>}
                        {isUser && !isCorrect && <span className="badge badge-danger">✗ Bạn chọn</span>}
                      </div>
                    );
                  })}
                  {d.question.explanation && <div className="alert alert-info mt-1" style={{ fontSize: '0.85rem' }}><strong>💡 Giải thích:</strong> {d.question.explanation}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <Link to="/exams" className="btn btn-secondary">← Về danh sách đề</Link>
        <Link to="/dashboard" className="btn btn-primary">📊 Xem tiến bộ</Link>
      </div>
    </div>
  );
}
