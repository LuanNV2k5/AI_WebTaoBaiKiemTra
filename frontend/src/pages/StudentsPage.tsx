import React, { useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import { Link } from 'react-router-dom';
import '../index.css';

interface StudentListOut {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  grade: number | null;
  total_exams: number;
  avg_score: number;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentListOut[]>([]);
  const [loading, setLoading] = useState(true);

  const [showManualModal, setShowManualModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '', grade: 10 });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  // === THÊM STATE PHÂN TRANG ===
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Đang để 10 học sinh/trang. Bạn có thể đổi thành 20, 50 tùy ý.

  const loadStudents = () => {
    usersApi.getStudents()
      .then(r => setStudents(r.data))
      .catch(err => alert('Lỗi khi tải danh sách học sinh: ' + (err.response?.data?.detail || err.message)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Reset về trang 1 mỗi khi đổi tab Khối lớp
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGrade]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersApi.createStudent(form);
      alert('Thêm học sinh thành công!');
      setShowManualModal(false);
      setForm({ username: '', email: '', password: '', full_name: '', grade: 10 });
      loadStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Lỗi khi thêm học sinh');
    }
  };

  const handleEditClick = (s: StudentListOut) => {
    setEditingStudentId(s.id);
    setForm({
      username: s.username,
      email: s.email,
      password: '', 
      full_name: s.full_name || '',
      grade: s.grade || 10
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;
    try {
      await usersApi.updateStudent(editingStudentId, form);
      alert('Cập nhật thông tin thành công!');
      setShowEditModal(false);
      setEditingStudentId(null);
      setForm({ username: '', email: '', password: '', full_name: '', grade: 10 });
      loadStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Lỗi khi cập nhật thông tin');
    }
  };

  const handleExcelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Vui lòng chọn file Excel');
    setUploading(true);
    try {
      const res = await usersApi.uploadStudents(file);
      alert(res.data.message);
      setShowExcelModal(false);
      setFile(null);
      loadStudents();
    } catch (err: any) {
      console.error("Upload error:", err);
      let errorMsg = 'Lỗi khi tải lên file';
      if (err.response?.data?.detail) {
        errorMsg = typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail);
      } else if (err.response) {
        errorMsg = `Lỗi server: ${err.response.status} - ${err.response.statusText}`;
      } else if (err.message) {
        errorMsg = `Lỗi mạng: ${err.message}`;
      }
      alert(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Xóa học sinh "${name}"? Thao tác này không thể hoàn tác!`)) return;
    try {
      await usersApi.deleteStudent(id);
      alert('Xóa học sinh thành công!');
      loadStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Lỗi khi xóa học sinh');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-gray)', marginTop: '1rem' }}>Đang tải danh sách học sinh...</p>
    </div>
  );

  return (
    <>
      <div className="std-container">
        
        {/* Header */}
        <div className="std-header">
          <div>
            <h1 className="std-title">Quản lý học sinh</h1>
          </div>
          <div className="std-actions">
            <button className="std-btn-excel" onClick={() => setShowExcelModal(true)}>
              📥 Nhập từ Excel
            </button>
            <button className="std-btn-add" onClick={() => setShowManualModal(true)}>
              [+] Thêm thủ công
            </button>
          </div>
        </div>

        {/* Tab chọn khối lớp */}
        <div className="std-tabs">
          {[null, 10, 11, 12].map(g => {
            const count = g === null ? students.length : students.filter(s => (s.grade || 10) === g).length;
            return (
              <button
                key={g ?? 'all'}
                onClick={() => setSelectedGrade(g)}
                className={`std-tab-btn ${selectedGrade === g ? 'active' : ''}`}
              >
                {g === null ? `Tất cả (${count})` : `Khối ${g} (${count})`}
              </button>
            );
          })}
        </div>

        {/* Bảng danh sách */}
        <div className="std-card" style={{ paddingBottom: 0 }}>
          {(() => {
            const filtered = selectedGrade === null ? students : students.filter(s => (s.grade || 10) === selectedGrade);
            
            // TÍNH TOÁN DỮ LIỆU PHÂN TRANG
            const totalPages = Math.ceil(filtered.length / itemsPerPage);
            const indexOfLastItem = currentPage * itemsPerPage;
            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
            const currentStudents = filtered.slice(indexOfFirstItem, indexOfLastItem);

            if (filtered.length === 0) return (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-gray)' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📭</span>
                <p style={{ margin: 0, fontSize: '1.1rem' }}>Chưa có học sinh nào trong {selectedGrade ? `Khối ${selectedGrade}` : 'hệ thống'}.</p>
              </div>
            );
            return (
              <>
                <div className="std-table-wrap" style={{ paddingBottom: '1.5rem' }}>
                  <p style={{ marginBottom: '12px', color: 'var(--text-gray)', fontSize: '0.95rem' }}>
                    Hiển thị <strong>{filtered.length}</strong> học sinh {selectedGrade ? `thuộc Khối ${selectedGrade}` : ''}
                  </p>
                  <table className="std-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>STT</th>
                        <th>Học sinh</th>
                        <th>Khối</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th style={{ textAlign: 'center' }}>Số bài đã thi</th>
                        <th style={{ textAlign: 'center' }}>Điểm TB</th>
                        <th style={{ textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentStudents.map((s, index) => (
                        <tr key={s.id}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-gray)' }}>
                            {indexOfFirstItem + index + 1}
                          </td>
                          <td><span style={{ fontWeight: 600 }}>{s.full_name || 'Chưa cập nhật'}</span></td>
                          <td><span className="std-badge-grade">Khối {s.grade || 10}</span></td>
                          <td><span className="std-badge-username">{s.username}</span></td>
                          <td style={{ color: 'var(--text-gray)' }}>{s.email}</td>
                          <td style={{ textAlign: 'center' }}><span className="std-badge-count">{s.total_exams}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`score-badge ${s.avg_score >= 80 ? 'score-good' : s.avg_score >= 50 ? 'score-avg' : 'score-bad'}`}>
                              {s.avg_score}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <Link to={`/students/${s.id}`} className="btn-view-link">Xem</Link>
                              <button className="action-btn btn-edit" onClick={() => handleEditClick(s)} title="Sửa">✏️</button>
                              <button className="action-btn btn-delete" onClick={() => handleDelete(s.id, s.full_name || s.username)} title="Xóa">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* === THANH PHÂN TRANG HIỆN ĐẠI === */}
                {totalPages > 1 && (
                  <div className="std-pagination">
                    <button 
                      className="std-page-btn" 
                      title="Về trang đầu"
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(1)}
                    >
                      &laquo;&laquo;
                    </button>
                    <button 
                      className="std-page-btn" 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      &laquo; Trước
                    </button>
                    
                    <span className="std-page-info">
                      Trang {currentPage} / {totalPages}
                    </span>
                    
                    <button 
                      className="std-page-btn" 
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      Sau &raquo;
                    </button>
                    <button 
                      className="std-page-btn" 
                      title="Đến trang cuối"
                      disabled={currentPage === totalPages} 
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      &raquo;&raquo;
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Manual Add Modal */}
      {showManualModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowManualModal(false)}>
          <div className="modal-box-sm">
            <div className="modal-header">
              <h3 className="modal-title">✨ Thêm học sinh thủ công</h3>
              <button className="modal-close modal-close-bg" onClick={() => setShowManualModal(false)}>✖</button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label className="form-label-navy">Tên đăng nhập <span style={{color: 'var(--jasper)'}}>*</span></label>
                <input className="form-input-navy" required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label-navy">Mật khẩu <span style={{color: 'var(--jasper)'}}>*</span></label>
                <input className="form-input-navy" required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label-navy">Họ và tên</label>
                <input className="form-input-navy" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label-navy">Khối lớp <span style={{color: 'var(--jasper)'}}>*</span></label>
                <select className="form-input-navy" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: Number(e.target.value) }))}>
                  <option value={10}>Khối 10</option>
                  <option value={11}>Khối 11</option>
                  <option value={12}>Khối 12</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label-navy">Email <span style={{color: 'var(--jasper)'}}>*</span></label>
                <input className="form-input-navy" required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <button type="submit" className="btn-submit-navy" style={{ marginTop: '0.5rem' }}>
                Thêm học sinh
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Student Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="modal-box-sm">
            <div className="modal-header">
              <h3 className="modal-title">✏️ Sửa thông tin học sinh</h3>
              <button className="modal-close modal-close-bg" onClick={() => setShowEditModal(false)}>✖</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label-navy">Tên đăng nhập <span style={{color: 'var(--text-gray)', fontWeight: 400}}>(Không thể đổi)</span></label>
                <input className="form-input-navy" disabled value={form.username} style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label className="form-label-navy">Mật khẩu mới</label>
                <input className="form-input-navy" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Để trống nếu không đổi..." />
              </div>
              <div className="form-group">
                <label className="form-label-navy">Họ và tên</label>
                <input className="form-input-navy" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label-navy">Khối lớp <span style={{color: 'var(--jasper)'}}>*</span></label>
                <select className="form-input-navy" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: Number(e.target.value) }))}>
                  <option value={10}>Khối 10</option>
                  <option value={11}>Khối 11</option>
                  <option value={12}>Khối 12</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label-navy">Email <span style={{color: 'var(--jasper)'}}>*</span></label>
                <input className="form-input-navy" required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <button type="submit" className="btn-submit-navy" style={{ marginTop: '0.5rem' }}>
                💾 Lưu thay đổi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. Excel Upload Modal */}
      {showExcelModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowExcelModal(false)}>
          <div className="modal-box-sm" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">📥 Nhập từ file Excel</h3>
              <button className="modal-close modal-close-bg" onClick={() => setShowExcelModal(false)}>✖</button>
            </div>
            <form onSubmit={handleExcelSubmit}>
              <div className="std-alert-info">
                <strong style={{ display: 'block', marginBottom: '4px' }}>Hướng dẫn cấu trúc file:</strong> 
                File Excel (.xlsx) cần có dòng đầu tiên là tiêu đề. Dữ liệu từ dòng thứ 2 theo thứ tự 5 cột:
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  <li><strong>Username</strong> (Bắt buộc)</li>
                  <li><strong>Password</strong> (Trống: mặc định 123456)</li>
                  <li><strong>Email</strong> (Trống: username@quizai.vn)</li>
                  <li><strong>Họ và tên</strong></li>
                  <li><strong>Khối lớp</strong> (VD: 10, 11, 12. Trống: mặc định 10)</li>
                </ul>
              </div>
              
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <div className="std-excel-zone">
                  <input 
                    id="excel-file-input" 
                    type="file" 
                    accept=".xlsx" 
                    onChange={e => setFile(e.target.files?.[0] || null)} 
                    style={{ marginBottom: '1rem', width: '100%' }} 
                  />
                  {file && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10b981', margin: 0 }}>
                        Đã chọn: {file.name}
                      </p>
                      <button 
                        type="button" 
                        style={{ background: 'var(--jasper-fade)', color: 'var(--jasper)', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }} 
                        onClick={() => { setFile(null); (document.getElementById('excel-file-input') as HTMLInputElement).value = ''; }}
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="btn-submit-navy" disabled={!file || uploading}>
                {uploading ? '⏳ Đang xử lý dữ liệu...' : '🚀 Bắt đầu Tải lên'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}