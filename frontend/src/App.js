import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import AmcManagement from './pages/AmcManagement';
import AmcDetails from './pages/AmcDetails';
import Services from './pages/Services';
import Payments from './pages/Payments';
import Inventory from './pages/Inventory';
import ManagerInvites from './pages/ManagerInvites';
import InviteAccept from './pages/InviteAccept';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { getUserRole } from './utils/auth';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;

  if (allowedRoles.length) {
    const role = getUserRole();
    const isAllowed = allowedRoles.map((item) => item.toUpperCase()).includes((role || '').toUpperCase());
    if (!isAllowed) return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="content">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/invite/accept" element={<InviteAccept />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/amc-management" element={<PrivateRoute><AmcManagement /></PrivateRoute>} />
          <Route path="/amc/:id" element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER', 'USER']}><AmcDetails /></PrivateRoute>} />
          <Route path="/services" element={<PrivateRoute><Services /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/payments" element={<PrivateRoute allowedRoles={['ADMIN', 'MANAGER']}><Payments /></PrivateRoute>} />
          <Route path="/admin/manager-invites" element={<PrivateRoute allowedRoles={['ADMIN']}><ManagerInvites /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={2600} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="colored" />
    </>
  );
}

export default App;