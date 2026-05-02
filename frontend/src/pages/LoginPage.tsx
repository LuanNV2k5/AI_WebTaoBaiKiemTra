import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      login(res.data.access_token, res.data.user); // Lưu ý: Dòng này đang bị lặp lại 2 lần trong code gốc của bạn
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
      login(res.data.access_token, res.data.user); // Lưu ý: Dòng này cũng đang bị lặp lại 2 lần
      alert('Đăng ký thành công!');
      navigate('/exams');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Đăng ký thất bại');
    } finally { setLoading(false); }
  };

  // --- PHẦN GIAO DIỆN DÙNG CHUNG CHO INPUT ĐỂ ĐỠ LẶP CODE ---
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-color, #e2e8f0)',
    backgroundColor: 'var(--bg-input, #f8fafc)',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary, #334155)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', // Nền gradient xanh lá nhẹ nhàng
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div className="card fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '3rem 2.5rem',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '2.5rem',
            marginBottom: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            backgroundColor: '#d1fae5',
            borderRadius: '50%',
            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)'
          }}>
            ⚡
          </div>
          <h1 className="text-gradient" style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
            Trắc nghiệm Toán học
          </h1>
          <p className="text-secondary" style={{ fontSize: '0.95rem', margin: 0, color: '#64748b' }}>
            Hệ thống kiểm tra & đánh giá thông minh
          </p>
        </div>

        {/* Tabs Toggle */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: '12px',
          padding: '6px',
          marginBottom: '2rem'
        }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'all 0.3s ease',
              background: tab === t ? '#ffffff' : 'transparent',
              color: tab === t ? '#10b981' : '#64748b',
              boxShadow: tab === t ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
            }}>
              {t === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          ))}
        </div>

        {/* Forms */}
        <div style={{ transition: 'all 0.3s' }}>
          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={labelStyle}>Tên đăng nhập</label>
                <input className="form-input" style={inputStyle} placeholder="admin hoặc hocsinh" value={form.username} onChange={e => set('username', e.target.value)} required />
              </div>
              
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={labelStyle}>Mật khẩu</label>
                <input className="form-input" style={{ ...inputStyle, paddingRight: '3rem' }} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: '12px', top: '38px',
                  background: 'none', border: 'none',
                  color: '#10b981', fontWeight: 600, fontSize: '0.85rem',
                  cursor: 'pointer', padding: '4px'
                }}>
                  {showPw ? 'Ẩn' : 'Hiện'}
                </button>
              </div>

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{
                marginTop: '0.5rem', padding: '14px', borderRadius: '10px', border: 'none',
                background: loading ? '#94a3b8' : '#10b981', color: '#fff',
                fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)', transition: 'background 0.2s'
              }}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập vào hệ thống'}
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
                  <label className="form-label" style={labelStyle}>Tên đăng nhập <span style={{color: '#ef4444'}}>*</span></label>
                  <input className="form-input" style={inputStyle} placeholder="username" value={form.username} onChange={e => set('username', e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" style={labelStyle}>Vai trò</label>
                  <select className="form-select" style={{ ...inputStyle, cursor: 'pointer' }} value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="student">Học sinh</option>
                    <option value="admin">Giáo viên (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={labelStyle}>Email <span style={{color: '#ef4444'}}>*</span></label>
                <input className="form-input" style={inputStyle} type="email" placeholder="email@truonghoc.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={labelStyle}>Mật khẩu <span style={{color: '#ef4444'}}>*</span></label>
                <input className="form-input" style={{ ...inputStyle, paddingRight: '3rem' }} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: '12px', top: '38px',
                  background: 'none', border: 'none',
                  color: '#10b981', fontWeight: 600, fontSize: '0.85rem',
                  cursor: 'pointer', padding: '4px'
                }}>
                  {showPw ? 'Ẩn' : 'Hiện'}
                </button>
              </div>

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading} style={{
                marginTop: '0.5rem', padding: '14px', borderRadius: '10px', border: 'none',
                background: loading ? '#94a3b8' : '#10b981', color: '#fff',
                fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)', transition: 'background 0.2s'
              }}>
                {loading ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}