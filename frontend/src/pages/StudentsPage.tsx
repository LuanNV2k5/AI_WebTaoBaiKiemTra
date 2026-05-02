import React, { useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import { Link } from 'react-router-dom';

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

  const loadStudents = () => {
    usersApi.getStudents()
      .then(r => setStudents(r.data))
      .catch(err => alert('Lỗi khi tải danh sách học sinh: ' + (err.response?.data?.detail || err.message)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, []);

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
      password: '', // Không hiện mật khẩu cũ vì lý do bảo mật
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

  if (loading) return <div className="loading-center"><div className="spinner"/><p className="text-secondary">Đang tải danh sách học sinh...</p></div>;

  return (
    <>
      <div className="page fade-in">
      <div className="flex-between mb-3">
        <div>
          <h1>👨‍🎓 Quản lý học sinh</h1>
          <p className="text-secondary mt-1">Tổng cộng {students.length} học sinh trong hệ thống</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setShowExcelModal(true)}>[Nhập Excel]</button>
          <button className="btn btn-primary" onClick={() => setShowManualModal(true)}>[+] Thêm thủ công</button>
        </div>
      </div>

      {/* Tab chọn khối lớp */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[null, 10, 11, 12].map(g => {
          const count = g === null ? students.length : students.filter(s => (s.grade || 10) === g).length;
          return (
            <button
              key={g ?? 'all'}
              onClick={() => setSelectedGrade(g)}
              style={{
                padding: '8px 20px',
                border: '2px solid var(--green-main)',
                borderRadius: '4px',
                background: selectedGrade === g ? 'var(--green-dark)' : '#fff',
                color: selectedGrade === g ? '#fff' : 'var(--green-dark)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {g === null ? `Tất cả (${count})` : `Khối ${g} (${count})`}
            </button>
          );
        })}
      </div>

      <div className="card">
        {(() => {
          const filtered = selectedGrade === null ? students : students.filter(s => (s.grade || 10) === selectedGrade);
          if (filtered.length === 0) return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <p>Chưa có học sinh nào trong {selectedGrade ? `Khối ${selectedGrade}` : 'hệ thống'}.</p>
            </div>
          );
          return (
            <div style={{ overflowX: 'auto' }}>
              <p style={{ marginBottom: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Hiển thị {filtered.length} học sinh{selectedGrade ? ` – Khối ${selectedGrade}` : ''}
              </p>
              <table className="table" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Học sinh</th>
                    <th>Khối</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th style={{ textAlign: 'center' }}>Số bài đã thi</th>
                    <th style={{ textAlign: 'center' }}>Điểm trung bình</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td><span style={{ fontWeight: 600 }}>{s.full_name || 'Chưa cập nhật'}</span></td>
                      <td><span className="badge badge-primary">Khối {s.grade || 10}</span></td>
                      <td><span className="badge badge-muted">{s.username}</span></td>
                      <td className="text-secondary">{s.email}</td>
                      <td style={{ textAlign: 'center' }}><span className="badge badge-accent">{s.total_exams}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${s.avg_score >= 80 ? 'badge-success' : s.avg_score >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                          {s.avg_score}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/students/${s.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem' }}>[Xem]</Link>
                        {' '}
                        <button className="btn btn-warning btn-sm" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleEditClick(s)}>[Sửa]</button>
                        {' '}
                        <button className="btn btn-danger btn-sm" style={{ padding: '0.3rem 0.6rem' }} onClick={() => handleDelete(s.id, s.full_name || s.username)}>[Xóa]</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>

      {/* Manual Add Modal */}
      {showManualModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={e => e.target === e.currentTarget && setShowManualModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <div className="flex-between mb-3">
              <h3>Thêm học sinh thủ công</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowManualModal(false)}>[X]</button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label className="form-label">Tên đăng nhập *</label>
                <input className="form-input" required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu *</label>
                <input className="form-input" required type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Khối lớp *</label>
                <select className="form-input" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: Number(e.target.value) }))}>
                  <option value={10}>Khối 10</option>
                  <option value={11}>Khối 11</option>
                  <option value={12}>Khối 12</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2">
                Thêm học sinh
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <div className="flex-between mb-3">
              <h3>Sửa thông tin học sinh</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>[X]</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Tên đăng nhập (không thể đổi)</label>
                <input className="form-input" disabled value={form.username} />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu mới (để trống nếu không đổi)</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Nhập mật khẩu mới..." />
              </div>
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Khối lớp *</label>
                <select className="form-input" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: Number(e.target.value) }))}>
                  <option value={10}>Khối 10</option>
                  <option value={11}>Khối 11</option>
                  <option value={12}>Khối 12</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2">
                Lưu thay đổi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Excel Upload Modal */}
      {showExcelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={e => e.target === e.currentTarget && setShowExcelModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 480 }}>
            <div className="flex-between mb-3">
              <h3>Nhập từ file Excel</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowExcelModal(false)}>[X]</button>
            </div>
            <form onSubmit={handleExcelSubmit}>
              <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
                <strong>Hướng dẫn:</strong> File Excel (.xlsx) cần có dòng đầu tiên là tiêu đề. Dữ liệu từ dòng thứ 2 theo thứ tự 5 cột: 
                <br/>1. Username (bắt buộc) 
                <br/>2. Password (nếu trống mặc định: 123456)
                <br/>3. Email (nếu trống mặc định: username@quizai.vn)
                <br/>4. Họ và tên
                <br/>5. Khối lớp (VD: 10, 11, 12. Nếu trống mặc định: 10)
              </div>
              <div className="form-group mt-3">
                <div style={{ border: '2px dashed var(--border)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)' }}>
                  <input id="excel-file-input" type="file" accept=".xlsx" onChange={e => setFile(e.target.files?.[0] || null)} style={{ marginBottom: '1rem', width: '100%' }} />
                  {file && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <p className="text-success" style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Đã chọn: {file.name}</p>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => { setFile(null); (document.getElementById('excel-file-input') as HTMLInputElement).value = ''; }}>Xóa</button>
                    </div>
                  )}
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2" disabled={!file || uploading}>
                {uploading ? 'Đang xử lý...' : '[Tải lên]'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
