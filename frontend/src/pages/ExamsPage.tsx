import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { examsApi } from '../services/api';
import { ExamListItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import { submissionsApi } from '../services/api';

const DIFF_COLORS: Record<string, string> = { 'Toán': '#6366f1', 'Lý': '#06b6d4', 'Hóa': '#10b981' };

export default function ExamsPage() {
  const { isAdmin } = useAuth();
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExam, setEditingExam] = useState<{id: number, title: string, grade: number, time_limit: number} | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [selectedExamTitle, setSelectedExamTitle] = useState('');

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đề thi này không? Mọi kết quả bài thi liên quan cũng sẽ bị xóa.")) return;
    try {
      await examsApi.delete(id);
      alert("Đã xóa đề thi");
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert("Lỗi khi xóa đề thi");
    }
  };

  const loadExams = (grade?: number | null) => {
    setLoading(true);
    examsApi.list(grade ? { grade } : undefined)
      .then(r => setExams(r.data))
      .catch(() => alert('Không thể tải danh sách đề thi'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExams(selectedGrade);
  }, [selectedGrade]);

  const handleEditClick = (exam: ExamListItem) => {
    setEditingExam({
      id: exam.id,
      title: exam.title,
      grade: exam.grade,
      time_limit: exam.time_limit
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    try {
      await examsApi.update(editingExam.id, {
        title: editingExam.title,
        grade: editingExam.grade,
        time_limit: editingExam.time_limit
      });
      alert("Cập nhật đề thi thành công!");
      setShowEditModal(false);
      loadExams(selectedGrade);
    } catch (err) {
      alert("Lỗi khi cập nhật đề thi");
    }
  };

  const handleViewResults = async (examId: number, title: string) => {
    try {
      setSelectedExamTitle(title);
      const res = await submissionsApi.getByExam(examId);
      setExamResults(res.data);
      setShowResultsModal(true);
    } catch (err) {
      alert("Lỗi khi tải bảng điểm");
    }
  };

  const filtered = exams.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-center"><div className="spinner"/><p className="text-secondary">Đang tải đề thi...</p></div>;

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1>📚 Danh sách đề thi</h1>
        <p className="text-secondary mt-1">Chọn đề thi và bắt đầu kiểm tra kiến thức của bạn</p>
      </div>

      {/* Grade Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[null, 10, 11, 12].map(g => (
          <button
            key={g ?? 'all'}
            onClick={() => setSelectedGrade(g)}
            style={{
              padding: '6px 16px',
              border: '2px solid var(--green-main)',
              borderRadius: '4px',
              background: selectedGrade === g ? 'var(--green-dark)' : '#fff',
              color: selectedGrade === g ? '#fff' : 'var(--green-dark)',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {g === null ? 'Tất cả' : `Khối ${g}`}
          </button>
        ))}
      </div>

      {/* Search + Stats */}
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          [Tìm] <input className="form-input" style={{ paddingLeft: '0.5rem', display: 'inline-block', width: '80%' }} placeholder="Tìm kiếm đề thi..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span className="badge badge-accent">{filtered.length} đề thi</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <p>Chưa có đề thi nào. Admin hãy tạo đề mới!</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((exam, i) => (
            <Link key={exam.id} to={`/exam/${exam.id}`} 
              className="card fade-in" style={{ textDecoration: 'none', animationDelay: `${i * 0.06}s`, display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer' }}>
              {/* Color bar */}
              <div style={{ height: 4, borderRadius: 2, background: 'var(--gradient)', marginBottom: '0.25rem' }} />

              <div>
                <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                  <span className="badge badge-accent">Khối {exam.grade || 10}</span>
                  <div className="flex gap-2" style={{ alignItems: 'center' }}>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {new Date(exam.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: '0.2rem', color: 'var(--accent)', background: 'transparent', border: 'none' }}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewResults(exam.id, exam.title); }}
                          title="Xem bảng điểm"
                        >
                          [Bảng điểm]
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: '0.2rem', color: 'var(--warning)', background: 'transparent', border: 'none' }}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(exam); }}
                          title="Sửa đề thi"
                        >
                          [Sửa]
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: '0.2rem', color: 'var(--danger)', background: 'transparent', border: 'none' }}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(exam.id); }}
                          title="Xóa đề thi"
                        >
                          [Xóa]
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 style={{ marginBottom: '0.25rem', lineHeight: 1.4 }}>{exam.title}</h3>
              </div>

              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <span className="badge badge-muted">Số câu: {exam.total_questions}</span>
                <span className="badge badge-muted">T.gian: {exam.time_limit} phút</span>
              </div>

              <div className="btn btn-primary btn-sm" style={{ marginTop: 'auto', justifyContent: 'center' }}>
                Bắt đầu thi &raquo;
              </div>
            </Link>
          ))}
        </div>
      )}
      {/* Edit Modal */}
      {showEditModal && editingExam && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <div className="flex-between mb-3">
              <h3>Sửa đề thi</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>[X]</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Tiêu đề đề thi</label>
                <input className="form-input" required value={editingExam.title} onChange={e => setEditingExam({...editingExam, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Khối lớp</label>
                <select className="form-input" value={editingExam.grade} onChange={e => setEditingExam({...editingExam, grade: Number(e.target.value)})}>
                  <option value={10}>Khối 10</option>
                  <option value={11}>Khối 11</option>
                  <option value={12}>Khối 12</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Thời gian (phút)</label>
                <input className="form-input" type="number" required value={editingExam.time_limit} onChange={e => setEditingExam({...editingExam, time_limit: Number(e.target.value)})} />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2">
                Lưu thay đổi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={e => e.target === e.currentTarget && setShowResultsModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-3">
              <h3>Bảng điểm: {selectedExamTitle}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowResultsModal(false)}>[X]</button>
            </div>
            
            {examResults.length === 0 ? (
              <p className="text-secondary" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có học sinh nào nộp bài.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Học sinh</th>
                    <th>Điểm</th>
                    <th>Thời gian</th>
                    <th>Ngày nộp</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {examResults.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                      <td>
                        <span className={`badge ${r.score >= 80 ? 'badge-success' : r.score >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                          {r.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="text-muted">{Math.floor(r.time_spent / 60)}p {r.time_spent % 60}s</td>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(r.submitted_at).toLocaleString('vi-VN')}</td>
                      <td>
                        <Link to={`/result/${r.id}`} className="btn btn-secondary btn-sm">[Chi tiết]</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
