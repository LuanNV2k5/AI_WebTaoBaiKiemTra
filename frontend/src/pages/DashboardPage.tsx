import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analyticsApi } from '../services/api';
import { StudentAnalytics } from '../types';
import '../index.css';

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchAnalytics = id ? analyticsApi.getStudentAnalytics(Number(id)) : analyticsApi.getMyAnalytics();
    fetchAnalytics.then(r => setData(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-gray)', marginTop: '1rem' }}>Đang phân tích dữ liệu học tập...</p>
    </div>
  );

  // Trạng thái chưa có dữ liệu
  if (!data || data.total_exams === 0) {
    return (
      <div className="dash-container">
        {id && <Link to="/students" className="dash-btn-back">← Quay lại danh sách</Link>}
        <div className="dash-header">
          <h1 className="dash-title">📊 Tiến bộ học tập {id && data?.username ? `của ${data.username}` : ''}</h1>
        </div>
        <div className="dash-empty-card">
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Chưa có dữ liệu</h3>
          <p style={{ color: 'var(--text-gray)' }}>Hãy hoàn thành ít nhất 1 bài kiểm tra để hệ thống phân tích tiến bộ.</p>
        </div>
      </div>
    );
  }

  // Set màu sắc cho điểm số
  const scoreColor = data.avg_score >= 80 ? '#10b981' : data.avg_score >= 60 ? '#f59e0b' : 'var(--jasper)';

  return (
    <div className="dash-container">
      {id && <Link to="/students" className="dash-btn-back">← Quay lại danh sách</Link>}
      
      <div className="dash-header">
        <h1 className="dash-title">📊 Tiến bộ học tập {id ? `của ${data.username}` : ''}</h1>
      </div>

      {/* 4 Thẻ Chỉ Số (Stat Cards) */}
      <div className="dash-stat-grid">
        {[
          { label: 'Bài đã thi', value: data.total_exams, icon: '📝', color: 'var(--cerulean)' },
          { label: 'Điểm TB', value: `${data.avg_score}`, icon: '📈', color: scoreColor },
          { label: 'Điểm cao nhất', value: `${data.best_score}`, icon: '🏆', color: '#10b981' },
          { label: 'Điểm thấp nhất', value: `${data.worst_score}`, icon: '📉', color: 'var(--jasper)' },
        ].map((s, i) => (
          <div key={i} className="dash-stat-card" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="dash-stat-icon">{s.icon}</div>
            <div className="dash-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="dash-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Các bảng phân tích (2 cột) */}
      <div className="dash-grid-2">
        <div className="dash-card">
          <h3 className="dash-card-title">📈 Xu hướng điểm số</h3>
          {data.score_trend.length > 0 ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th style={{ textAlign: 'center' }}>Điểm số</th>
                  </tr>
                </thead>
                <tbody>
                  {data.score_trend.map((s, i) => (
                    <tr key={i}>
                      <td>{s.date}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--cerulean)' }}>{s.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p style={{ color: 'var(--text-gray)' }}>Cần thêm bài thi để xem xu hướng.</p>}
        </div>

        <div className="dash-card">
          <h3 className="dash-card-title">🧠 Phân tích loại kiến thức</h3>
          {data.knowledge_stats.length > 0 ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Loại KT</th>
                    <th style={{ textAlign: 'center' }}>Độ chính xác (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.knowledge_stats.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{s.knowledge_type}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`score-badge ${s.accuracy >= 80 ? 'score-good' : s.accuracy >= 60 ? 'score-avg' : 'score-bad'}`}>
                          {s.accuracy}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p style={{ color: 'var(--text-gray)' }}>Chưa có dữ liệu.</p>}
        </div>
      </div>

      {/* Bảng phân tích theo chương */}
      {data.chapter_stats.length > 0 && (
        <div className="dash-card" style={{ marginBottom: '2rem' }}>
          <h3 className="dash-card-title">📚 Kết quả theo chương</h3>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Chương</th>
                  <th style={{ textAlign: 'center' }}>Độ chính xác (%)</th>
                </tr>
              </thead>
              <tbody>
                {data.chapter_stats.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{s.chapter_name || `Chương ${s.chapter}`}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`score-badge ${s.accuracy >= 80 ? 'score-good' : s.accuracy >= 60 ? 'score-avg' : 'score-bad'}`}>
                        {s.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Multi-exam feedback */}
      {data.multi_exam_feedback && (
        <div className="dash-card dash-ai-card">
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 className="dash-card-title" style={{ margin: 0 }}>🤖 Phân tích tổng hợp từ AI</h3>
            <span className="dash-badge-accent">Dựa trên {data.total_exams} bài kiểm tra</span>
          </div>
          <p className="dash-ai-text">{data.multi_exam_feedback}</p>
        </div>
      )}
    </div>
  );
}