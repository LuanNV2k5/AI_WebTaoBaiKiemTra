import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';
import '../index.css'; // Đảm bảo import file CSS vào

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

  return (
    <div className="login-container">
      
      {/* ================= CỘT TRÁI ================= */}
      <div className="login-left-col">
        <div className="login-logo-container">
          <img src="/logo.jpeg" alt="MathGen Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <h1 className="login-heading-left">Trắc nghiệm Toán học</h1>
        <p className="login-text-left">
          Nền tảng kiểm tra, đánh giá và phân tích năng lực thông minh bằng AI. 
          Bứt phá điểm số của bạn ngay hôm nay!
        </p>
      </div>

      {/* ================= CỘT PHẢI ================= */}
      <div className="login-right-col">
        <div className="login-form-wrapper">
          <h2 className="login-heading-right">
            {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          <p className="login-text-right">
            {tab === 'login' ? 'Vui lòng điền thông tin để truy cập hệ thống' : 'Bắt đầu hành trình học tập của bạn'}
          </p>

          {/* Tab Toggle */}
          <div className="login-tab-container">
            {(['login', 'register'] as const).map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)} 
                className={`login-tab-btn ${tab === t ? 'active' : ''}`}
              >
                {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            ))}
          </div>

          {/* Forms */}
          <div>
            {tab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label-navy">Tên đăng nhập</label>
                  <input className="form-input-navy" placeholder="Nhập tài khoản của bạn" value={form.username} onChange={e => set('username', e.target.value)} required />
                </div>
                
                <div className="form-group input-with-icon">
                  <label className="form-label-navy">Mật khẩu</label>
                  <input className="form-input-navy" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="btn-toggle-pw">
                    {showPw ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>

                <button type="submit" disabled={loading} className="btn-submit-navy">
                  {loading ? 'Đang xử lý...' : 'Đăng nhập ngay'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label-navy">Họ và tên</label>
                  <input className="form-input-navy" placeholder="VD: Nguyễn Văn A" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                
                <div className="form-group-flex">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label-navy">Tài khoản <span style={{color: '#ef4444'}}>*</span></label>
                    <input className="form-input-navy" placeholder="username" value={form.username} onChange={e => set('username', e.target.value)} required />
                  </div>
                  
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label-navy">Vai trò</label>
                    <div className="role-radio-group">
                      <label className="role-radio-label">
                        <input type="radio" name="role" value="student" checked={form.role === 'student'} onChange={e => set('role', e.target.value)} className="role-radio-input" />
                        Học sinh
                      </label>
                      <label className="role-radio-label">
                        <input type="radio" name="role" value="admin" checked={form.role === 'admin'} onChange={e => set('role', e.target.value)} className="role-radio-input" />
                        Giáo viên
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label-navy">Email <span style={{color: '#ef4444'}}>*</span></label>
                  <input className="form-input-navy" type="email" placeholder="email@truonghoc.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>

                <div className="form-group input-with-icon">
                  <label className="form-label-navy">Mật khẩu <span style={{color: '#ef4444'}}>*</span></label>
                  <input className="form-input-navy" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="btn-toggle-pw">
                    {showPw ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>

                <button type="submit" disabled={loading} className="btn-submit-navy">
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