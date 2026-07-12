import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService, managerInviteService } from '../services/api';

const ManagerInvites = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [invites, setInvites] = useState([]);
  const [latestLink, setLatestLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    try {
      const response = await managerInviteService.listInvites();
      setInvites(response.data || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout();
        navigate('/login');
        return;
      }
      toast.error(err.response?.data?.error || 'Failed to load invites.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setLatestLink('');
    setSubmitting(true);

    try {
      const response = await managerInviteService.createInvite({ email, expiryDays: Number(expiryDays) });
      const created = response.data?.invite;
      if (created) {
        setInvites((prev) => [created, ...prev]);
      } else {
        await loadInvites();
      }
      setLatestLink(response.data?.inviteLink || '');
      toast.success('Manager invite sent successfully.');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create invite.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id) => {
    setRevokingId(id);
    try {
      const response = await managerInviteService.revokeInvite(id);
      const updated = response.data;
      setInvites((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast.success('Invite revoked successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to revoke invite.');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <>
      <div className="page-hero">
        <div>
          <span className="hero-pill">Access Control</span>
          <h1>Manager Invites</h1>
          <p>
            Create and manage invite links for manager account onboarding.
          </p>
        </div>
      </div>

      <div className="data-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <form onSubmit={handleCreateInvite}>
          <div className="form-group">
            <label>Manager Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@company.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Expiry (Days)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Sending Invite...' : 'Send Invite'}
          </button>
        </form>

        {latestLink && (
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Latest Invite Link</label>
            <input type="text" value={latestLink} readOnly style={{ width: '100%' }} />
          </div>
        )}
      </div>

      <div className="data-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th className="company-header">Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Expires At</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>Loading invites...</td>
                </tr>
              ) : invites.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>No invites found.</td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="company-cell">{invite.invitedEmail}</td>
                    <td>{invite.invitedRole}</td>
                    <td>{invite.status}</td>
                    <td>{invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : 'N/A'}</td>
                    <td>{invite.invitedByEmail || 'N/A'}</td>
                    <td>
                      {invite.status === 'PENDING' ? (
                        <button
                          className="btn btn-outline btn-small"
                          style={{ borderColor: '#fca5a5', color: '#b91c1c' }}
                          onClick={() => handleRevoke(invite.id)}
                          disabled={revokingId === invite.id}
                        >
                          {revokingId === invite.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ManagerInvites;
