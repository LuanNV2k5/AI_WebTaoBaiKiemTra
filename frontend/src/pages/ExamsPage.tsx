import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { examsApi } from '../services/api';
import { ExamListItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import { submissionsApi } from '../services/api';
import '../index.css'; // Đảm bảo import CSS

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

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner" style={{ borderTopColor: '#2563eb' }}></div>
      <p style={{ color: '#64748b', marginTop: '1rem' }}>Đang tải danh sách đề thi...</p>
    </div>
  );

  return (
    <div className="exams-container">
      
      {/* Header */}
      <div className="exams-header-section">
        <h1 className="exams-title">📚 Kho Đề Thi</h1>
        <p className="exams-subtitle">Lựa chọn đề thi phù hợp để kiểm tra và nâng cao kiến thức của bạn.</p>
      </div>

      {/* Control Panel: Tabs & Search */}
      <div className="exams-controls">
        <div className="exams-tabs">
          {[null, 10, 11, 12].map(g => (
            <button
              key={g ?? 'all'}
              onClick={() => setSelectedGrade(g)}
              className={`exams-tab-btn ${selectedGrade === g ? 'active' : ''}`}
            >
              {g === null ? 'Tất cả' : `Khối ${g}`}
            </button>
          ))}
        </div>

        <div className="exams-search">
          <span className="exams-search-icon">🔍</span>
          <input 
            className="exams-search-input"
            placeholder="Tìm kiếm đề thi..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="exams-count">
        Hiển thị <strong>{filtered.length}</strong> đề thi phù hợp
      </div>

      {/* Grid Đề Thi */}
      {filtered.length === 0 ? (
        <div className="exams-empty">
          <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0 }}>Chưa có đề thi nào trong danh mục này.</p>
          {isAdmin && <p style={{ color: '#2563eb', fontWeight: 600, marginTop: '0.5rem' }}>Hãy chuyển sang tab Quản lý để tạo đề mới!</p>}
        </div>
      ) : (
        <div className="exams-grid">
          {filtered.map((exam, i) => (
            <Link key={exam.id} to={`/exam/${exam.id}`} className="exam-card" style={{ animationDelay: `${i * 0.05}s` }}>
              
              <div className="exam-card-header">
                <span className="exam-badge-grade">Khối {exam.grade || 10}</span>
                <span className="exam-date">{new Date(exam.created_at).toLocaleDateString('vi-VN')}</span>
              </div>

              <h3 className="exam-title">{exam.title}</h3>

              <div className="exam-meta">
                <span className="exam-meta-item">📝 <strong>{exam.total_questions}</strong> câu</span>
                <span className="exam-meta-item">⏱️ <strong>{exam.time_limit}</strong> phút</span>
              </div>

              <div className="exam-footer">
                {isAdmin && (
                  <div className="exam-actions">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewResults(exam.id, exam.title); }}
                      title="Xem bảng điểm" className="action-btn btn-view"
                    >📊</button>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(exam); }}
                      title="Sửa đề thi" className="action-btn btn-edit"
                    >✏️</button>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(exam.id); }}
                      title="Xóa đề thi" className="action-btn btn-delete"
                    >🗑️</button>
                  </div>
                )}
                
                <div className="exam-start-btn">
                  Làm bài ngay →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ----------------- MODALS ----------------- */}

      {/* Edit Modal */}
      {showEditModal && editingExam && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-box-sm">
            <div className="modal-header">
              <h3 className="modal-title">✏️ Sửa thông tin đề</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✖</button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label-navy">Tiêu đề đề thi</label>
                <input required className="form-input-navy" value={editingExam.title} onChange={e => setEditingExam({...editingExam, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label-navy">Khối lớp</label>
                <select className="form-input-navy" value={editingExam.grade} onChange={e => setEditingExam({...editingExam, grade: Number(e.target.value)})}>
                  <option value={10}>Khối 10</option>
                  <option value={11}>Khối 11</option>
                  <option value={12}>Khối 12</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label-navy">Thời gian (phút)</label>
                <input type="number" className="form-input-navy" required value={editingExam.time_limit} onChange={e => setEditingExam({...editingExam, time_limit: Number(e.target.value)})} />
              </div>
              <button type="submit" className="btn-submit-navy" style={{ marginTop: '0.5rem' }}>
                Lưu thay đổi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowResultsModal(false)}>
          <div className="modal-box-lg">
            
            <div className="modal-header modal-header-lg">
              <h3 className="modal-title">📊 Bảng điểm: <span style={{ color: '#2563eb' }}>{selectedExamTitle}</span></h3>
              <button className="modal-close modal-close-bg" onClick={() => setShowResultsModal(false)}>✖</button>
            </div>
            
            <div className="results-body">
              {examResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                  <p style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>📭</p>
                  <p style={{ margin: 0 }}>Chưa có học sinh nào nộp bài thi này.</p>
                </div>
              ) : (
                <table className="results-table">
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
                    {examResults.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{r.student_name}</td>
                        <td>
                          <span className={`score-badge ${r.score >= 80 ? 'score-good' : r.score >= 50 ? 'score-avg' : 'score-bad'}`}>
                            {r.score.toFixed(1)}
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.9rem' }}>{Math.floor(r.time_spent / 60)}p {r.time_spent % 60}s</td>
                        <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{new Date(r.submitted_at).toLocaleString('vi-VN')}</td>
                        <td>
                          <Link to={`/result/${r.id}`} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#2563eb', textDecoration: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Chi tiết</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}