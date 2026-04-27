import React from 'react';

const ServicesFilter = ({ filters, setFilters, onReset }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="filter-panel card" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Status</label>
          <select 
            name="status" 
            value={filters.status} 
            onChange={handleChange}
            className="form-input"
            style={{ marginTop: '0.25rem' }}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Company Name</label>
          <input 
            type="text" 
            name="companyName" 
            value={filters.companyName} 
            onChange={handleChange} 
            placeholder="Search company..."
            className="form-input"
            style={{ marginTop: '0.25rem' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>From Date</label>
          <input 
            type="date" 
            name="startDate" 
            value={filters.startDate} 
            onChange={handleChange} 
            className="form-input"
            style={{ marginTop: '0.25rem' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>To Date</label>
          <input 
            type="date" 
            name="endDate" 
            value={filters.endDate} 
            onChange={handleChange} 
            className="form-input"
            style={{ marginTop: '0.25rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            style={{ flex: 1, padding: '0.625rem' }}
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServicesFilter;
