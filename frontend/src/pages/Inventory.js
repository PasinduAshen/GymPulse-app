import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/api';
import MachineGrid from '../components/inventory/MachineGrid';
import SparePartList from '../components/inventory/SparePartList';
import AddMachineModal from '../components/inventory/AddMachineModal';
import AddSparePartModal from '../components/inventory/AddSparePartModal';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState('machines');
  const [stats, setStats] = useState({ totalMachines: 0, totalSpareParts: 0, lowStockCount: 0 });
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [showAddSparePart, setShowAddSparePart] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshStats = () => {
    inventoryService.getStats()
      .then(res => setStats(res.data))
      .catch(() => {});
  };

  useEffect(() => { refreshStats(); }, [refreshKey]);

  const onSaved = () => {
    setShowAddMachine(false);
    setShowAddSparePart(false);
    setRefreshKey(k => k + 1);
  };

  return (
    <div style={{ padding: '32px 36px', minHeight: '100vh', background: '#f8fafc' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Inventory Management
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '14px' }}>
            View and manage all your gym equipment in stock.
          </p>
        </div>
        <button
          onClick={() => activeTab === 'machines' ? setShowAddMachine(true) : setShowAddSparePart(true)}
          style={{
            background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px',
            padding: '10px 20px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
          {activeTab === 'machines' ? 'Add Machine' : 'Add Spare Part'}
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Machines', value: stats.totalMachines, icon: '🏋️', color: '#eff6ff', border: '#bfdbfe' },
          { label: 'Total Spare Parts', value: stats.totalSpareParts, icon: '📦', color: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Low Stock Alerts', value: stats.lowStockCount, icon: '⚠️', color: stats.lowStockCount > 0 ? '#fff7ed' : '#f0fdf4', border: stats.lowStockCount > 0 ? '#fed7aa' : '#bbf7d0' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: s.color, border: `1px solid ${s.border}`,
            borderRadius: '12px', padding: '18px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{s.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{s.value}</p>
            </div>
            <span style={{ fontSize: '30px' }}>{s.icon}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
        {[{ key: 'machines', label: '🔧 Machines' }, { key: 'spareParts', label: '📦 Spare Parts' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '10px 22px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: activeTab === tab.key ? '600' : '400', fontSize: '14px',
            color: activeTab === tab.key ? '#2563eb' : '#64748b',
            borderBottom: `2px solid ${activeTab === tab.key ? '#2563eb' : 'transparent'}`,
            marginBottom: '-2px', transition: 'all 0.2s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'machines'
        ? <MachineGrid key={`machines-${refreshKey}`} onEdit={() => setRefreshKey(k => k + 1)} />
        : <SparePartList key={`parts-${refreshKey}`} onEdit={() => setRefreshKey(k => k + 1)} />
      }

      {/* Modals */}
      {showAddMachine && (
        <AddMachineModal onClose={() => setShowAddMachine(false)} onSaved={onSaved} />
      )}
      {showAddSparePart && (
        <AddSparePartModal onClose={() => setShowAddSparePart(false)} onSaved={onSaved} />
      )}
    </div>
  );
};

export default Inventory;