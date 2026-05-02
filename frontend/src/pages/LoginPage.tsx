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
      login(res.data.access_token, res.data.user);
      alert('Đăng ký thành công!');
      navigate('/exams');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Đăng ký thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '2rem' }}>

      <div className="card fade-in" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚡</div>
          <h1 className="text-gradient" style={{ fontSize: '1.75rem' }}>Trắc nghiệm Toán học</h1>
          <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Hệ thống trắc nghiệm thông minh</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '4px', marginBottom: '1.5rem' }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '0.5rem', border: 'none', cursor: 'pointer', borderRadius: '8px',
              fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
              background: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-secondary)'
            }}>
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Tên đăng nhập</label>
              <input className="form-input" placeholder="admin hoặc hocsinh" value={form.username} onChange={e => set('username', e.target.value)} required />
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Mật khẩu</label>
              <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ marginTop: '5px' }}>
                {showPw ? 'Ẩn MK' : 'Hiện MK'}
              </button>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              [Đăng nhập] {loading ? '...' : ''}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input className="form-input" placeholder="Nguyễn Văn A" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tên đăng nhập *</label>
              <input className="form-input" placeholder="username" value={form.username} onChange={e => set('username', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu *</label>
              <input className="form-input" type="password" placeholder="••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Vai trò</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="student">Học sinh</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
