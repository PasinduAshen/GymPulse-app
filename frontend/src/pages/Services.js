import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { amcService, authService } from '../services/api';
import ServicesFilter from '../components/ServicesFilter';
import { hasAnyRole } from '../utils/auth';

const Services = () => {
  const canManageServices = hasAnyRole(['ADMIN', 'MANAGER']);
  const [schedules, setSchedules] = useState([]);
  const [filters, setFilters] = useState({
    status: 'All',
    companyName: '',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Completion Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await amcService.getSchedules(filters);
      setSchedules(response.data);
      return response.data;
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        authService.logout();
        navigate('/login');
      }
      setError('Failed to load service schedules.');
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const filteredSchedules = useMemo(() => {
    const term = (filters.companyName || '').trim().toLowerCase();
    if (!term) return schedules;

    return schedules.filter((schedule) =>
      (schedule.amcContract?.companyName || '').toLowerCase().includes(term)
    );
  }, [schedules, filters.companyName]);

  const handleResetFilters = () => {
    setFilters({
      status: 'All',
      companyName: '',
      startDate: '',
      endDate: ''
    });
  };

  const openCompletionModal = (service) => {
    setSelectedService(service);
    setCompletionNotes('');
    setShowModal(true);
  };

  const handleCompleteService = async () => {
    if (!selectedService || isSubmitting) return;
    
    const selectedId = selectedService.id;
    setIsSubmitting(true);
    setError('');
    try {
      await amcService.completeService(selectedId, completionNotes);

      // Optimistically update local state so users immediately see completion.
      setSchedules((prev) =>
        prev.map((schedule) =>
          schedule.id === selectedId
            ? { ...schedule, status: 'COMPLETED' }
            : schedule
        )
      );

      setShowModal(false);
      setSelectedService(null);
      await fetchSchedules();
    } catch (err) {
      const msg = err.response?.data || 'Failed to complete service.';
      const messageText = typeof msg === 'object' ? JSON.stringify(msg) : String(msg);
      const lowerMessage = messageText.toLowerCase();
      const alreadyCompleted = lowerMessage.includes('already') && lowerMessage.includes('completed');

      if (alreadyCompleted) {
        setSchedules((prev) =>
          prev.map((schedule) =>
            schedule.id === selectedId
              ? { ...schedule, status: 'COMPLETED' }
              : schedule
          )
        );
        setShowModal(false);
        setSelectedService(null);
        await fetchSchedules();
      } else {
        setError(messageText);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-hero">
        <div>
          <span className="hero-pill">Service Desk</span>
          <h1>Service Schedules</h1>
          <p>
            Track and manage upcoming maintenance for your gym equipment.
          </p>
        </div>
      </div>

      <ServicesFilter 
        filters={filters} 
        setFilters={setFilters} 
        onReset={handleResetFilters} 
      />

      {error && <div className="error-msg">{error}</div>}

      <div className="data-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Scheduled Date</th>
                <th>Completed Date</th>
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
                    No service schedules found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map(schedule => (
                  <tr key={schedule.id}>
                    <td>
                      <div className="machine-cell">
                        <span className="machine-name">{schedule.amcContract?.companyName || 'Unknown Company'}</span>
                      </div>
                    </td>
                    <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg style={{width: '16px', color: '#64748b'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            {schedule.scheduledDate}
                        </div>
                    </td>
                    <td>{schedule.completedDate || '-'}</td>
                    <td>
                      <span className={`status-badge ${
                        schedule.status === 'COMPLETED' ? 'status-active' : 
                        schedule.status === 'OVERDUE' ? 'status-expired' : 'status-pending'
                      }`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          className="btn btn-primary btn-small" 
                          disabled={schedule.status === 'COMPLETED' || !canManageServices}
                          onClick={() => openCompletionModal(schedule)}
                        >
                          {canManageServices ? 'Mark Complete' : 'Read Only'}
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
                Are you sure you want to mark maintenance for <strong>{selectedService?.amcContract?.companyName || 'this company'}</strong> as completed?
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
                type="button"
                className="btn btn-outline" 
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={handleCompleteService}
                disabled={isSubmitting || !selectedService}
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
