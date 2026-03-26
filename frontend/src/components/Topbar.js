import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const Topbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="topbar">
      <div className="topbar-actions">
        <button onClick={handleLogout} className="logout-btn-nav">
          <svg style={{width: '18px', marginRight: '8px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Topbar;
