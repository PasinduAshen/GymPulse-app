import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { amcService, authService } from '../services/api';
import { getUserRole } from '../utils/auth';

const AmcManagement = () => {
  const role = getUserRole();
  const canUploadAmc = role === 'ADMIN';
  const canEditOrRenew = role === 'ADMIN';
  const canOpenDetails = role === 'ADMIN' || role === 'MANAGER' || role === 'USER';
  const [amcs, setAmcs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const fetchAmcs = useCallback(async () => {
    try {
      const response = await amcService.getAmcs();
      setAmcs(response.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        authService.logout();
        navigate('/login');
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchAmcs();
  }, [fetchAmcs]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await amcService.uploadPdf(formData);
      navigate(`/amc/${response.data}`);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data || err.message || 'Upload failed';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const filteredAmcs = amcs.filter((amc) => {
    const matchesSearch =
      amc.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'All' ||
      amc.status === filterStatus.toUpperCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="page-hero">
        <div>
          <span className="hero-pill">Contract Center</span>
          <h1>AMC Management</h1>
          <p>Manage active contracts, renewals, and equipment coverage windows.</p>
        </div>
        {canUploadAmc && (
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={triggerFileInput} disabled={loading}>
              <svg style={{ width: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              {loading ? 'Processing...' : 'Add Contract'}
            </button>
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".pdf"
        onChange={handleFileUpload}
      />

      <div className="controls-row">
        <div className="search-wrapper">
          <svg className="search-icon" style={{ width: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          {['All', 'Active', 'Expired'].map((status) => (
            <button
              key={status}
              className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="data-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>AMC Start</th>
                <th>AMC End</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAmcs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No contracts found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredAmcs.map((amc) => (
                  <tr key={amc.id}>
                    <td>
                      <div className="machine-cell">
                        <span className="machine-name">{amc.companyName || 'Unknown Company'}</span>
                      </div>
                    </td>
                    <td>{amc.startDate || 'N/A'}</td>
                    <td>{amc.endDate || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${
                        amc.status === 'ACTIVE' ? 'status-active' :
                        amc.status === 'EXPIRED' ? 'status-expired' :
                        amc.status === 'EXTRACTED' ? 'status-extracted' : 'status-pending'
                      }`}>
                        {amc.status || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        {canEditOrRenew && (
                          <>
                            <button
                              className="btn btn-outline btn-small"
                              title="Edit"
                              onClick={() => navigate(`/amc/${amc.id}`)}
                            >
                              <svg style={{ width: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                              Edit
                            </button>
                            <button
                              className="btn btn-primary btn-small"
                              title="Renew"
                              disabled={amc.status === 'ACTIVE'}
                              onClick={() => navigate(`/amc/${amc.id}`)}
                            >
                              <svg style={{ width: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                              Renew
                            </button>
                          </>
                        )}
                        {!canEditOrRenew && canOpenDetails && (
                          <button
                            className="btn btn-outline btn-small"
                            title="View"
                            onClick={() => navigate(`/amc/${amc.id}`)}
                          >
                            View
                          </button>
                        )}
                        {!canEditOrRenew && !canOpenDetails && (
                          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Read Only</span>
                        )}
                      </div>
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

export default AmcManagement;
