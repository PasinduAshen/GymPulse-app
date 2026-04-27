import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { amcService } from '../services/api';
import ServiceHistory from '../components/ServiceHistory';
import { getUserRole } from '../utils/auth';

const AmcDetails = () => {
  const role = getUserRole();
  const canEditAmc = role === 'ADMIN';
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    companyName: '',
    machineName: '',
    brand: '',
    startDate: '',
    endDate: '',
    serviceFrequency: '',
    contactInfo: '',
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleExtract = useCallback(async () => {
    if (!canEditAmc) return;
    setLoading(true);
    setError('');
    try {
      const response = await amcService.extractDetails(id);
      setData(response.data);
      setStatus(response.data.status);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data || err.message || 'AI Extraction failed.';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  }, [id, canEditAmc]);

  const loadContractDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await amcService.getAmcs();
      const contract = (response.data || []).find((item) => String(item.id) === String(id));

      if (!contract) {
        setError('Contract not found or not accessible.');
        return;
      }

      setData({
        companyName: contract.companyName || '',
        machineName: contract.machineName || '',
        brand: contract.brand || '',
        startDate: contract.startDate || '',
        endDate: contract.endDate || '',
        serviceFrequency: contract.serviceFrequency || '',
        contactInfo: contract.contactInfo || '',
      });
      setStatus(contract.status || '');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data || err.message || 'Failed to load contract details.';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (canEditAmc) {
      handleExtract();
    } else {
      loadContractDetails();
    }
  }, [canEditAmc, handleExtract, loadContractDetails]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!canEditAmc) return;
    setLoading(true);
    try {
      await amcService.updateAmc(id, data);
      navigate('/amc-management');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data || err.message || 'Failed to save details. Please try again.';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <button 
        onClick={() => navigate('/amc-management')} 
        className="btn btn-outline"
        style={{ marginBottom: '1.5rem' }}
      >
        <svg style={{width: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back to AMC Management
      </button>
      
      <div className="card">
        <div className="card-title">
          AMC Contract Verification{' '}
          <span className={`status-badge ${
            status === 'ACTIVE' ? 'status-active' : 
            status === 'EXPIRED' ? 'status-expired' : 
            status === 'EXTRACTED' ? 'status-extracted' : 'status-pending'
          }`}>
            {status || 'PENDING'}
          </span>
        </div>

        {loading && <div className="success-msg">Processing... Please wait.</div>}
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleConfirm}>
          <div className="details-grid">
            <div className="form-group">
              <label>Company Name</label>
              <input 
                type="text" 
                name="companyName" 
                placeholder="e.g. FitService Inc."
                value={data.companyName || ''} 
                onChange={handleChange} 
                disabled={!canEditAmc}
                required
              />
            </div>
            <div className="form-group">
              <label>Machine Name</label>
              <input 
                type="text" 
                name="machineName" 
                placeholder="e.g. Treadmill X1"
                value={data.machineName || ''} 
                onChange={handleChange} 
                disabled={!canEditAmc}
                required
              />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input 
                type="text" 
                name="brand" 
                placeholder="e.g. LifeFitness"
                value={data.brand || ''} 
                onChange={handleChange} 
                disabled={!canEditAmc}
              />
            </div>
            <div className="form-group">
              <label>Service Frequency</label>
              <select 
                name="serviceFrequency" 
                value={data.serviceFrequency || ''} 
                onChange={handleChange}
                disabled={!canEditAmc}
                required
              >
                <option value="">Select Frequency</option>
                <option value="1 months">1 month</option>
                <option value="3 months">3 months</option>
                <option value="4 months">4 months</option>
                <option value="6 months">6 months</option>
                <option value="12 months">12 months</option>
              </select>
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input 
                type="date" 
                name="startDate" 
                value={data.startDate || ''} 
                onChange={handleChange} 
                disabled={!canEditAmc}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input 
                type="date" 
                name="endDate" 
                value={data.endDate || ''} 
                onChange={handleChange} 
                disabled={!canEditAmc}
                required
              />
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Contact & Additional Info</label>
            <textarea 
              name="contactInfo" 
              placeholder="Address, Phone, Email..."
              value={data.contactInfo || ''} 
              onChange={handleChange} 
              disabled={!canEditAmc}
              rows="4"
            />
          </div>

          {canEditAmc && (
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button type="submit" disabled={loading} className="btn btn-success">
                <svg style={{width: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                {loading ? 'Saving...' : 'Confirm & Save Contract'}
              </button>
              <button 
                type="button" 
                onClick={handleExtract} 
                disabled={loading} 
                className="btn btn-primary"
              >
                <svg style={{width: '18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Retry AI Extraction
              </button>
            </div>
          )}
        </form>
      </div>

      {status === 'ACTIVE' && id && <ServiceHistory amcId={id} />}
    </div>
  );
};

export default AmcDetails;
