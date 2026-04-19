import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { hasAnyRole } from '../utils/auth';

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    allowedRoles: ['ADMIN', 'MANAGER', 'USER'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h7V3H3v9zm11 9h7v-9h-7v9zM3 21h7v-5H3v5zm11-9h7V3h-7v9z"></path></svg>
    ),
  },
  {
    to: '/amc-management',
    label: 'AMC Management',
    allowedRoles: ['ADMIN', 'MANAGER', 'USER'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
    ),
  },
  {
    to: '/services',
    label: 'Services',
    allowedRoles: ['ADMIN', 'MANAGER', 'USER'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
    ),
  },
  {
    to: '/inventory',
    label: 'Inventory',
    allowedRoles: ['ADMIN', 'MANAGER', 'USER'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
    ),
  },
  {
    to: '/payments',
    label: 'Payments',
    allowedRoles: ['ADMIN', 'MANAGER'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    ),
  },
  {
    to: '/admin/manager-invites',
    label: 'Manager Invites',
    allowedRoles: ['ADMIN'],
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
    ),
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const visibleItems = navItems.filter((item) => hasAnyRole(item.allowedRoles));

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <Link to="/dashboard" className="sidebar-header" style={{ textDecoration: 'none' }}>GymPulse</Link>
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout-btn" title="Logout">
          <svg style={{ width: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;