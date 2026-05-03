import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../index.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { 
    logout(); 
    navigate('/login'); 
  };

  return (
    <nav className="navbar-navy">
      <div className="navbar-inner-navy">
        
        {/* Logo / Brand */}
        <NavLink to="/" className="navbar-brand-navy">
          <span>⚡</span> Trắc nghiệm Toán học
        </NavLink>

        {/* Navigation Links */}
        <div className="navbar-links-navy">
          <NavLink to="/exams" className={({ isActive }) => `nav-link-navy${isActive ? ' active' : ''}`}>
            Đề thi
          </NavLink>
          {!isAdmin && (
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link-navy${isActive ? ' active' : ''}`}>
              Tiến bộ
            </NavLink>
          )}
          {isAdmin && (
            <>
              <NavLink to="/create-exam" className={({ isActive }) => `nav-link-navy${isActive ? ' active' : ''}`}>
                Tạo đề
              </NavLink>
              <NavLink to="/question-bank" className={({ isActive }) => `nav-link-navy${isActive ? ' active' : ''}`}>
                Ngân hàng
              </NavLink>
              <NavLink to="/knowledge-types" className={({ isActive }) => `nav-link-navy${isActive ? ' active' : ''}`}>
                Loại KT
              </NavLink>
              <NavLink to="/students" className={({ isActive }) => `nav-link-navy${isActive ? ' active' : ''}`}>
                Học sinh
              </NavLink>
            </>
          )}
        </div>

        {/* User Profile & Actions */}
        <div className="navbar-user-navy">
          <span className="user-name-navy">
            {user?.full_name || user?.username}
          </span>
          <span className={isAdmin ? 'badge-role-admin' : 'badge-role-student'}>
            {isAdmin ? 'Admin' : 'Học sinh'}
          </span>
          <button className="btn-logout-navy" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
        
      </div>
    </nav>
  );
}