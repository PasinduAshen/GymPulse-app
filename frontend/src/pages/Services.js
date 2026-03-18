import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { amcService, authService } from '../services/api';

const Services = () => {
  const [schedules, setSchedules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Completion Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const openCompletionModal = (service) => {
    setSelectedService(service);
    setCompletionNotes('');
    setShowModal(true);
  };

  const handleCompleteService = async () => {
    if (!selectedService) return;
    
    setIsSubmitting(true);
    try {
      await amcService.completeService(selectedService.id, completionNotes);
      setShowModal(false);
      // Refresh the schedules list to reflect the new state
      fetchSchedules();
    } catch (err) {
      const msg = err.response?.data || 'Failed to complete service.';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setIsSubmitting(false);
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
                          className="btn btn-primary btn-small" 
                          disabled={schedule.status === 'COMPLETED'}
                          onClick={() => openCompletionModal(schedule)}
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

      {/* Completion Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Confirm Maintenance Completion</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem' }}>
                Are you sure you want to mark maintenance for <strong>{selectedService?.amcContract?.machineName}</strong> as completed?
              </p>
              
              <div className="form-group">
                <label>Completion Notes (Optional)</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '100px', paddingTop: '0.75rem' }}
                  placeholder="E.g. Lubricated belt, replaced filter..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleCompleteService}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Confirm Completion'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          animation: modalAppear 0.3s ease-out;
        }
        @keyframes modalAppear {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #1e293b;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #64748b;
          cursor: pointer;
        }
        .modal-body {
          padding: 1.5rem;
        }
        .modal-footer {
          padding: 1.25rem 1.5rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
      `}</style>
    </>
  );
};

export default Services;
