import React, { useState, useEffect } from 'react';
import { amcService } from '../services/api';

const ServiceHistory = ({ amcId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (amcId) {
      fetchHistory();
    }
  }, [amcId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await amcService.getServiceHistory(amcId);
      setHistory(response.data);
    } catch (err) {
      setError('Failed to load service history.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading history...</div>;
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Service History
        <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#64748b' }}>
          {history.length} records found
        </span>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Scheduled Month/Date</th>
              <th>Status</th>
              <th>Completion Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No service history available for this machine.
                </td>
              </tr>
            ) : (
              history.map(record => (
                <tr key={record.id}>
                  <td>
                    <strong>{record.scheduledDate}</strong>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      record.status === 'COMPLETED' ? 'status-active' : 
                      record.status === 'OVERDUE' ? 'status-expired' : 'status-pending'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td>{record.completedDate || '-'}</td>
                  <td style={{ maxWidth: '300px', fontSize: '0.875rem' }}>
                    {record.notes || <em style={{ color: '#94a3b8' }}>No notes provided</em>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceHistory;
