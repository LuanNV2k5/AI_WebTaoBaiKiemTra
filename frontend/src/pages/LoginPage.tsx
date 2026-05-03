import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', password: '', email: '', full_name: '', role: 'student' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form.username, form.password);
      login(res.data.access_token, res.data.user);
      alert(`Chào mừng, ${res.data.user.full_name || res.data.user.username}!`);
      navigate('/exams');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Đăng nhập thất bại');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.register(form);
      login(res.data.access_token, res.data.user);
      alert('Đăng ký thành công!');
      navigate('/exams');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Đăng ký thất bại');
    } finally { setLoading(false); }
  };

  // --- STYLE CHO GIAO DIỆN MỚI (TÔNG BLUE/NAVY SANG TRỌNG) ---
  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1', // Viền xám nhạt tinh tế
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#334155',
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      overflow: 'hidden', 
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif' // Dùng font hiện đại
    }}>
      
      {/* ================= CỘT TRÁI (NỀN XANH NAVY / INDIGO) ================= */}
      <div style={{
        flex: 1, 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', // Chuyển sang dải màu xanh biển sâu cực sang
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        textAlign: 'center',
        position: 'relative' // Để chèn hoạ tiết nếu muốn
      }}>
        
        {/* Vùng chứa Logo: Phóng to và Bo góc vuông thay vì tròn */}
        <div style={{
          width: '240px', // Đã phóng to logo đáng kể
          height: '240px',
          backgroundColor: '#ffffff',
          borderRadius: '24px', // Bo góc mềm mại (squircle) giúp không bị cắt chữ MathGen
          padding: '15px', // Trừ hao khoảng trắng cho logo thở
          marginBottom: '2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' // Bóng đổ sâu hơn
        }}>
          <img 
            src="/logo.jpeg" 
            alt="MathGen Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} // contain để đảm bảo không mất tia nào của hình
          />
        </div>
        
        {/* Force chữ màu trắng để chống chìm vào nền */}
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#ffffff', letterSpacing: '-0.5px' }}>
          Trắc nghiệm Toán học
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#e2e8f0', maxWidth: '85%', lineHeight: 1.6, opacity: 0.9 }}>
          Nền tảng kiểm tra, đánh giá và phân tích năng lực thông minh bằng AI. 
          Bứt phá điểm số của bạn ngay hôm nay!
        </p>
      </div>


      {/* ================= CỘT PHẢI (TRẮNG, CHỨA FORM) ================= */}
      <div style={{
        flex: 1, 
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        overflowY: 'auto'
      }}>
        
        <div style={{ width: '100%', maxWidth: '420px', margin: 'auto' }}>
          
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#1e293b', textAlign: 'center', letterSpacing: '-0.5px' }}>
            {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
            {tab === 'login' ? 'Vui lòng điền thông tin để truy cập hệ thống' : 'Bắt đầu hành trình học tập của bạn'}
          </p>

          {/* Tab Toggle - Đổi màu highlight sang Xanh dương */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '12px',
            padding: '6px',
            marginBottom: '2rem'
          }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer',
                borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem',
                transition: 'all 0.3s ease',
                background: tab === t ? '#ffffff' : 'transparent',
                color: tab === t ? '#2563eb' : '#64748b', // Màu chữ xanh dương khi active
                boxShadow: tab === t ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
              }}>
                {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div style={{ transition: 'all 0.3s' }}>
            {tab === 'login' ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={labelStyle}>Tên đăng nhập</label>
                  <input className="form-input" style={inputStyle} placeholder="Nhập tài khoản của bạn" value={form.username} onChange={e => set('username', e.target.value)} required />
                </div>
                
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label" style={labelStyle}>Mật khẩu</label>
                  <input className="form-input" style={{ ...inputStyle, paddingRight: '3.5rem' }} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position: 'absolute', right: '12px', top: '39px',
                    background: 'none', border: 'none',
                    color: '#2563eb', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: '4px' // Nút hiện/ẩn màu xanh dương
                  }}>
                    {showPw ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>

                <button type="submit" disabled={loading} style={{
                  marginTop: '1.5rem', padding: '15px', borderRadius: '10px', border: 'none',
                  background: loading ? '#93c5fd' : '#2563eb', // Nút bấm màu xanh biển đậm
                  color: '#fff', fontSize: '1.05rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)', transition: 'background 0.2s', letterSpacing: '0.5px'
                }}>
                  {loading ? 'Đang xử lý...' : 'Đăng nhập ngay'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={labelStyle}>Họ và tên</label>
                  <input className="form-input" style={inputStyle} placeholder="VD: Nguyễn Văn A" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={labelStyle}>Tài khoản <span style={{color: '#ef4444'}}>*</span></label>
                    <input className="form-input" style={inputStyle} placeholder="username" value={form.username} onChange={e => set('username', e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={labelStyle}>Vai trò</label>
                    <select className="form-select" style={{ ...inputStyle, cursor: 'pointer' }} value={form.role} onChange={e => set('role', e.target.value)}>
                      <option value="student">Học sinh</option>
                      <option value="admin">Giáo viên</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={labelStyle}>Email <span style={{color: '#ef4444'}}>*</span></label>
                  <input className="form-input" style={inputStyle} type="email" placeholder="email@truonghoc.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label" style={labelStyle}>Mật khẩu <span style={{color: '#ef4444'}}>*</span></label>
                  <input className="form-input" style={{ ...inputStyle, paddingRight: '3.5rem' }} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position: 'absolute', right: '12px', top: '39px',
                    background: 'none', border: 'none',
                    color: '#2563eb', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: '4px'
                  }}>
                    {showPw ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>

                <button type="submit" disabled={loading} style={{
                  marginTop: '1.5rem', padding: '15px', borderRadius: '10px', border: 'none',
                  background: loading ? '#93c5fd' : '#2563eb', // Nút bấm màu xanh biển đậm
                  color: '#fff', fontSize: '1.05rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)', transition: 'background 0.2s', letterSpacing: '0.5px'
                }}>
                  {loading ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}