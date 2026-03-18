import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { amcService, authService } from '../services/api';

const Services = () => {
  const [schedules, setSchedules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await amcService.getSchedules();
      setSchedules(response.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        authService.logout();
        navigate('/login');
      }
      setError('Failed to load service schedules.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    const machineName = schedule.amcContract?.machineName || '';
    const brand = schedule.amcContract?.brand || '';
    
    const matchesSearch = 
      machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'All' || 
      schedule.status === filterStatus.toUpperCase();
    
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>Service Schedules</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Track and manage upcoming maintenance for your gym equipment.
          </p>
        </div>
      </div>

      <div className="controls-row">
        <div className="search-wrapper">
          <svg className="search-icon" style={{width: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search machine or brand..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          {['All', 'Pending', 'Completed'].map(status => (
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
                <th>Machine</th>
                <th>Brand</th>
                <th>Scheduled Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    Loading schedules...
                  </td>
                </tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No service schedules found.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map(schedule => (
                  <tr key={schedule.id}>
                    <td>
                      <div className="machine-cell">
                        <span className="machine-name">{schedule.amcContract?.machineName || 'Unknown Machine'}</span>
                      </div>
                    </td>
                    <td>{schedule.amcContract?.brand || 'N/A'}</td>
                    <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg style={{width: '16px', color: '#64748b'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            {schedule.scheduledDate}
                        </div>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        schedule.status === 'COMPLETED' ? 'status-active' : 'status-pending'
                      }`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button 
                          className="btn btn-outline btn-small" 
                          disabled={schedule.status === 'COMPLETED'}
                        >
                          Mark Complete
                        </button>
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

export default Services;
