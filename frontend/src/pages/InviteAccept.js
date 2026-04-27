import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { managerInviteService } from '../services/api';

const InviteAccept = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invite, setInvite] = useState(null);
  const [form, setForm] = useState({
    email: '',
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setError('Invite token is missing.');
        setIsChecking(false);
        return;
      }

      try {
        const response = await managerInviteService.validateInvite(token);
        const payload = response.data;
        setInvite(payload);
        setForm((prev) => ({ ...prev, email: payload.invitedEmail || '' }));
      } catch (err) {
        setError(err.response?.data?.error || 'Invalid or expired invite token.');
      } finally {
        setIsChecking(false);
      }
    };

    validateInvite();
  }, [token]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await managerInviteService.acceptInvite({
        token,
        email: form.email,
        name: form.name,
        username: form.username,
        password: form.password,
      });

      const authToken = response.data?.token;
      if (authToken) {
        localStorage.setItem('token', authToken);
      }

      toast.success('Manager account created successfully. Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept invite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2 className="auth-title">Validating Invite...</h2>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2 className="auth-title" style={{ color: '#b91c1c' }}>Invite Unavailable</h2>
          {error && <div className="error-msg">{error}</div>}
          <p className="auth-footer" style={{ marginTop: '1rem' }}>
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">GymPulse</div>
        <h2 className="auth-title">Complete Manager Setup</h2>
        <p style={{ marginTop: '-0.75rem', marginBottom: '1.25rem', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
          You were invited as a <strong>{invite.invitedRole}</strong>. Fill your details to activate your account.
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button className="btn-add" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Activate Manager Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InviteAccept;
