import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.forgotPassword(email);
      setSuccess('Recovery code sent! Check your terminal if email fails.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send recovery code. Ensure email is registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.verifyCode(email, code);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired recovery code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
    }

    setIsLoading(true);
    setError('');
    try {
      await authService.resetPassword({ email, code, newPassword });
      setSuccess('Password updated! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">GymPulse</div>
        <h2 className="auth-title">
          {step === 1 && 'Forgot Password'}
          {step === 2 && 'Verify Code'}
          {step === 3 && 'New Password'}
        </h2>
        
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}
        
        {step === 1 && (
          <form onSubmit={handleRequestCode}>
            <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Enter your email address and we'll send you a 6-digit recovery code.
            </p>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-add" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Recovery Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Enter the 6-digit code for <strong>{email}</strong>.
            </p>
            <div className="form-group">
              <label>Recovery Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-add" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.875rem' }}>
                Change Email
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-add" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        )}
        
        <p className="auth-footer">
          Remember your password? <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
