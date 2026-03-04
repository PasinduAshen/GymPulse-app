import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (!token) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          GymPulse
        </Link>
        <div className="navbar-links">
          <Link to="/dashboard" className="nav-item">Dashboard</Link>
          <button onClick={handleLogout} className="logout-btn-nav">Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
