import React from 'react';

const StatCard = ({ title, value, icon, color, alert }) => (
  <div style={{
    background: 'white', borderRadius: '12px', padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: `1px solid ${alert ? '#fee2e2' : '#f3f4f6'}`,
    flex: 1,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>{title}</p>
        <p style={{ fontSize: '32px', fontWeight: '700', color: alert ? '#ef4444' : '#111827' }}>{value}</p>
      </div>
      <span style={{ fontSize: '28px' }}>{icon}</span>
    </div>
  </div>
);

const InventoryStats = ({ stats }) => (
  <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
    <StatCard title="Total Machines" value={stats.totalMachines} icon="🏋️" />
    <StatCard title="Total Spare Parts" value={stats.totalSpareParts} icon="📦" />
    <StatCard title="Low Stock Alerts" value={stats.lowStockCount} icon="⚠️" color="red" alert={stats.lowStockCount > 0} />
  </div>
);

export default InventoryStats;