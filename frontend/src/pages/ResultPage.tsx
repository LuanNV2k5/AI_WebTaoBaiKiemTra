import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { submissionsApi } from '../services/api';
import { Submission } from '../types';
import '../index.css';

const LETTERS = ['A', 'B', 'C', 'D'];
const KT_NAMES: Record<string, string> = { concept: 'Khái niệm', theorem: 'Định lý', property: 'Tính chất', exercise: 'Dạng bài tập' };

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : 'var(--jasper)';
  const r = 54, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  
  return (
    <div className="res-score-ring">
      <svg width={140} height={140} className="res-ring-svg">
        <circle cx={70} cy={70} r={r} fill="none" stroke="var(--border-light)" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease-out' }} />
      </svg>
      <div className="res-ring-text-box">
        <span className="res-ring-score" style={{ color }}>{score.toFixed(0)}</span>
        <span className="res-ring-max">/ 100</span>
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

  useEffect(() => {
    if ((window as any).renderMathInElement) {
      (window as any).renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false
      });
    }
  }, [sub, showAll, expanded]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-gray)', marginTop: '1rem' }}>Đang tải kết quả...</p>
    </div>
  );
  
  if (!sub) return (
    <div className="res-container">
      <div style={{ background: 'var(--jasper-fade)', color: 'var(--jasper)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold' }}>
        Không tìm thấy kết quả bài thi này.
      </div>
    </div>
  );

  const correct = sub.details.filter(d => d.is_correct).length;
  const mins = String(Math.floor(sub.time_spent / 60)).padStart(2, '0');
  const secs = String(sub.time_spent % 60).padStart(2, '0');

  // Logic phân tích theo kiến thức
  const ktMap: Record<string, { c: number; t: number }> = {};
  sub.details.forEach(d => {
    const kt = d.question.knowledge_type;
    if (!ktMap[kt]) ktMap[kt] = { c: 0, t: 0 };
    ktMap[kt].t++;
    if (d.is_correct) ktMap[kt].c++;
  });

  const display = showAll ? sub.details : sub.details.slice(0, 5);

  return (
    <div className="res-container">
      
      <div className="res-header">
        <h1 className="res-title">🎉 Kết quả bài thi</h1>
        <p className="res-subtitle">Xem chi tiết kết quả làm bài và nhận xét chuyên sâu từ AI</p>
      </div>

      {/* --- Khối Điểm số & Biểu đồ kiến thức --- */}
      <div className="res-top-grid">
        
        {/* Khối Trái: Vòng tròn điểm */}
        <div className="res-card res-score-box">
          <ScoreRing score={sub.score} />
          <div>
            <h2 className="res-score-info-title">
              {sub.score >= 80 ? '🏆 Quá Xuất Sắc!' : sub.score >= 60 ? '👍 Rất Tốt' : '📚 Cần Cố Gắng Hơn'}
            </h2>
            <div className="res-badge-group">
              <span className="res-badge res-badge-correct">✓ {correct} câu trả lời đúng</span>
              <span className="res-badge res-badge-wrong">✗ {sub.details.length - correct} câu trả lời sai</span>
              <span className="res-badge res-badge-time">⏱ Thời gian: {mins} phút {secs} giây</span>
            </div>
          </div>
        </div>

        {/* Khối Phải: Tiến trình kiến thức */}
        <div className="res-card">
          <h4 className="res-card-title">📊 Mức độ hoàn thành theo dạng bài</h4>
          
          {Object.entries(ktMap).map(([kt, v]) => {
            const percent = (v.c / v.t) * 100;
            const barColor = percent >= 70 ? '#10b981' : percent >= 50 ? '#f59e0b' : 'var(--jasper)';
            return (
              <div key={kt} className="res-prog-item">
                <div className="res-prog-header">
                  <span className="res-prog-name">{KT_NAMES[kt] || kt}</span>
                  <span className="res-prog-stats" style={{ color: barColor }}>
                    {v.c}/{v.t} ({Math.round(percent)}%)
                  </span>
                </div>
                <div className="res-prog-track">
                  <div className="res-prog-fill" style={{ width: `${percent}%`, background: barColor }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Khối AI Feedback --- */}
      {sub.ai_feedback && (
        <div className="res-card res-ai-card">
          <div className="res-ai-header">
            <h3 className="res-ai-title">🧠 ĐÁNH GIÁ KIẾN THỨC CHI TIẾT</h3>
            <span className="res-ai-badge">AI Evaluator</span>
          </div>
          <div className="res-ai-content">
            {sub.ai_feedback}
          </div>
        </div>
      )}

      {/* --- Chi tiết câu hỏi --- */}
      <div className="res-card">
        <div className="res-q-header">
          <h3 className="res-card-title" style={{ margin: 0 }}>📖 Chi tiết từng câu</h3>
          <button 
            onClick={() => setShowAll(!showAll)}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-app)', cursor: 'pointer', fontWeight: 600, color: 'var(--text-gray)' }}
          >
            {showAll ? 'Thu gọn' : `Xem tất cả (${sub.details.length})`}
          </button>
        </div>

        <div>
          {display.map((d, i) => {
            const isOpen = expanded.has(d.question_id);
            const opts = [d.question.option_a, d.question.option_b, d.question.option_c, d.question.option_d];
            
            return (
              <div key={i} className="res-q-item">
                <div className="res-q-toggle" onClick={() => setExpanded(s => { const n = new Set(s); isOpen ? n.delete(d.question_id) : n.add(d.question_id); return n; })}>
                  <div className="res-q-title-wrap">
                    <span className="res-q-icon" style={{ color: d.is_correct ? '#10b981' : 'var(--jasper)' }}>
                      {d.is_correct ? '✓' : '✗'}
                    </span>
                    <span className="res-q-text">
                      Câu {i + 1}: {d.question.content.slice(0, 80)}{d.question.content.length > 80 ? '...' : ''}
                    </span>
                  </div>
                  <span className="res-q-arrow">{isOpen ? '▲' : '▼'}</span>
                </div>
                
                {isOpen && (
                  <div className="res-q-body">
                    {opts.map((opt, j) => {
                      const letter = LETTERS[j];
                      const isCorrect = letter === d.question.correct_answer;
                      const isUser = letter === d.user_answer;
                      
                      let rowClass = '';
                      if (isCorrect) rowClass = 'correct';
                      else if (isUser && !isCorrect) rowClass = 'wrong';

                      return (
                        <div key={j} className={`res-opt-row ${rowClass}`}>
                          <div className="res-opt-letter">{letter}</div>
                          <span className="res-opt-text">{opt}</span>
                          
                          {isCorrect && <span className="res-badge res-badge-correct" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>✓ Đáp án đúng</span>}
                          {isUser && !isCorrect && <span className="res-badge res-badge-wrong" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>✗ Bạn chọn</span>}
                        </div>
                      );
                    })}
                    
                    {d.question.explanation && (
                      <div className="res-exp-box">
                        <strong>💡 Giải thích:</strong> {d.question.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Action Buttons --- */}
      <div className="res-actions">
        <Link to="/exams" className="res-btn-back">← Về danh sách đề thi</Link>
        <Link to="/dashboard" className="res-btn-dash">📊 Xem bảng tiến bộ</Link>
      </div>

    </div>
  );
}