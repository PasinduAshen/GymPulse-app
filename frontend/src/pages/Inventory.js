import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/api';
import MachineGrid from '../components/inventory/MachineGrid';
import SparePartList from '../components/inventory/SparePartList';
import AddMachineModal from '../components/inventory/AddMachineModal';
import AddSparePartModal from '../components/inventory/AddSparePartModal';
import { getUserRole } from '../utils/auth';

const Inventory = () => {
  const role = getUserRole();
  const canEditInventory = role === 'ADMIN' || role === 'MANAGER';
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
    <div className="inventory-page">

      <div className="page-hero">
        <div>
          <span className="hero-pill">Stock Command</span>
          <h1>Inventory Management</h1>
          <p>View and manage all your gym equipment in stock.</p>
        </div>
        {canEditInventory && (
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => activeTab === 'machines' ? setShowAddMachine(true) : setShowAddSparePart(true)}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
              {activeTab === 'machines' ? 'Add Machine' : 'Add Spare Part'}
            </button>
          </div>
        )}
      </div>

      {!canEditInventory && (
        <div className="data-card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem', border: '1px solid #bfdbfe' }}>
          Inventory is in read-only mode for your role. Only Admin or Manager can add, edit, delete, or adjust stock.
        </div>
      )}

      {/* Stats Row */}
      <div className="inventory-stats-row">
        {[
          { label: 'Total Machines', value: stats.totalMachines, icon: '🏋️', color: '#eff6ff', border: '#bfdbfe' },
          { label: 'Total Spare Parts', value: stats.totalSpareParts, icon: '📦', color: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Low Stock Alerts', value: stats.lowStockCount, icon: '⚠️', color: stats.lowStockCount > 0 ? '#fff7ed' : '#f0fdf4', border: stats.lowStockCount > 0 ? '#fed7aa' : '#bbf7d0' },
        ].map((s, i) => (
          <div key={i} className="inventory-stat-card" style={{
            flex: 1, background: s.color, border: `1px solid ${s.border}`,
            borderRadius: '12px', padding: '18px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p className="inventory-stat-label" style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{s.label}</p>
              <p className="inventory-stat-value" style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{s.value}</p>
            </div>
            <span className="inventory-stat-icon" style={{ fontSize: '30px' }}>{s.icon}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="inventory-tabs-row" style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
        {[{ key: 'machines', label: '🔧 Machines' }, { key: 'spareParts', label: '📦 Spare Parts' }].map(tab => (
          <button key={tab.key} className={`inventory-tab-btn ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)} style={{
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
        ? <MachineGrid key={`machines-${refreshKey}`} onEdit={() => setRefreshKey(k => k + 1)} canEdit={canEditInventory} />
        : <SparePartList key={`parts-${refreshKey}`} onEdit={() => setRefreshKey(k => k + 1)} canEdit={canEditInventory} />
      }

      {/* Modals */}
      {showAddMachine && (
        <AddMachineModal onClose={() => setShowAddMachine(false)} onSaved={onSaved} />
      )}
      {showAddSparePart && (
        <AddSparePartModal onClose={() => setShowAddSparePart(false)} onSaved={onSaved} />
      )}

      <style>{`
        .inventory-page {
          padding: 0;
          min-height: auto;
          background: transparent;
        }

        .inventory-stats-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .inventory-tabs-row {
          overflow-x: auto;
          white-space: nowrap;
        }

        .inventory-tab-btn {
          white-space: nowrap;
        }

        @media (max-width: 980px) {
          .inventory-stats-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .inventory-stats-row {
            grid-template-columns: 1fr;
            margin-bottom: 18px;
          }

          .inventory-stat-card {
            padding: 14px 16px !important;
          }

          .inventory-stat-label {
            font-size: 12px !important;
          }

          .inventory-stat-value {
            font-size: 22px !important;
          }

          .inventory-stat-icon {
            font-size: 25px !important;
          }

          .inventory-tab-btn {
            padding: 9px 14px !important;
            font-size: 13px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Inventory;