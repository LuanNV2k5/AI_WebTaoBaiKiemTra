import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analyticsApi } from '../services/api';
import { StudentAnalytics } from '../types';

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchAnalytics = id ? analyticsApi.getStudentAnalytics(Number(id)) : analyticsApi.getMyAnalytics();
    fetchAnalytics.then(r => setData(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-center"><div className="spinner"/><p className="text-secondary">Đang phân tích dữ liệu...</p></div>;

  if (!data || data.total_exams === 0) {
    return (
      <div className="page fade-in">
        {id && <Link to="/students" className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem', display: 'inline-flex' }}>← Quay lại</Link>}
        <h1 style={{ marginBottom: '0.5rem' }}>📊 Tiến bộ học tập {id && data?.username ? `của ${data.username}` : ''}</h1>
        <div className="card" style={{ textAlign: 'center', padding: '4rem', marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Chưa có dữ liệu</h3>
          <p className="text-muted">Hãy hoàn thành ít nhất 1 bài kiểm tra để xem phân tích tiến bộ.</p>
        </div>
      </div>
    );
  }

  const scoreColor = data.avg_score >= 80 ? 'var(--success)' : data.avg_score >= 60 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="page fade-in">
      {id && <Link to="/students" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>← Quay lại danh sách</Link>}
      <h1 style={{ marginBottom: '0.25rem' }}>📊 Tiến bộ học tập {id ? `của ${data.username}` : ''}</h1>
      <p className="text-secondary mb-3">Phân tích chi tiết kết quả học tập của {id ? 'học sinh' : 'bạn'}</p>

      {/* Stat cards */}
      <div className="grid-4 mb-3">
        {[
          { label: 'Bài đã thi', value: data.total_exams, icon: '📝', color: 'var(--accent-hover)' },
          { label: 'Điểm TB', value: `${data.avg_score}`, icon: '📈', color: scoreColor },
          { label: 'Điểm cao nhất', value: `${data.best_score}`, icon: '🏆', color: 'var(--success)' },
          { label: 'Điểm thấp nhất', value: `${data.worst_score}`, icon: '📉', color: 'var(--danger)' },
        ].map((s, i) => (
          <div key={i} className="stat-card fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
            <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-3">
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Xu hướng điểm số</h3>
          {data.score_trend.length > 0 ? (
            <table className="table">
              <thead><tr><th>Ngày</th><th>Điểm số</th></tr></thead>
              <tbody>
                {data.score_trend.map((s, i) => <tr key={i}><td>{s.date}</td><td>{s.score}</td></tr>)}
              </tbody>
            </table>
          ) : <p className="text-muted">Cần thêm bài thi để xem xu hướng.</p>}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Phân tích loại kiến thức</h3>
          {data.knowledge_stats.length > 0 ? (
            <table className="table">
              <thead><tr><th>Loại KT</th><th>Độ chính xác (%)</th></tr></thead>
              <tbody>
                {data.knowledge_stats.map((s, i) => <tr key={i}><td>{s.knowledge_type}</td><td>{s.accuracy}%</td></tr>)}
              </tbody>
            </table>
          ) : <p className="text-muted">Chưa có dữ liệu.</p>}
        </div>
      </div>

      {data.chapter_stats.length > 0 && (
        <div className="card mb-3">
          <h3 style={{ marginBottom: '1.25rem' }}>Kết quả theo chương</h3>
          <table className="table">
            <thead><tr><th>Chương</th><th>Độ chính xác (%)</th></tr></thead>
            <tbody>
              {data.chapter_stats.map((s, i) => <tr key={i}><td>{s.chapter_name || `Chương ${s.chapter}`}</td><td>{s.accuracy}%</td></tr>)}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Multi-exam feedback */}
      {data.multi_exam_feedback && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h3>Phân tích tổng hợp từ AI</h3>
              <span className="badge badge-accent" style={{ marginTop: 2 }}>Dựa trên {data.total_exams} bài kiểm tra</span>
            </div>
          </div>
          <p style={{ lineHeight: 1.9, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{data.multi_exam_feedback}</p>
        </div>
      )}
    </div>
  );
}
