import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">📚 Trắc nghiệm Toán học</NavLink>

        <div className="navbar-links">
          <NavLink to="/exams" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Đề thi
          </NavLink>
          {!isAdmin && (
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Tiến bộ
            </NavLink>
          )}
          {isAdmin && (
            <>
              <NavLink to="/create-exam" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Tạo đề
              </NavLink>
              <NavLink to="/question-bank" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Ngân hàng
              </NavLink>
              <NavLink to="/knowledge-types" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Loại KT
              </NavLink>
              <NavLink to="/students" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Học sinh
              </NavLink>
            </>
          )}
        </div>

        <div className="navbar-user">
          <span style={{ color: '#d0e8d6', fontSize: '13px' }}>
            {user?.full_name || user?.username}
          </span>
          <span className={`badge ${isAdmin ? 'badge-accent' : 'badge-success'}`}>
            {isAdmin ? 'Admin' : 'Học sinh'}
          </span>
          <button className="btn btn-sm" style={{ background: '#c0392b', color: '#fff', border: 'none' }} onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}
