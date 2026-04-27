import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/api';
import EditMachineModal from './EditMachineModal';

const STATUS_STYLES = {
  ACTIVE:      { bg: '#dcfce7', color: '#166534', label: 'Active' },
  INACTIVE:    { bg: '#f1f5f9', color: '#475569', label: 'Inactive' },
  MAINTENANCE: { bg: '#fef3c7', color: '#92400e', label: 'Ret Maintenance' },
};

const CATEGORY_OPTIONS = ['All Categories', 'Cardio', 'Strength', 'Free Weights', 'Flexibility', 'Other'];

const MachineGrid = ({ onEdit, canEdit = false }) => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMachine, setEditMachine] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [searchName, setSearchName] = useState('');
  const [searchBrand, setSearchBrand] = useState('');
  // NEW: toast + confirm delete
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMachines = () => {
    inventoryService.getMachines()
      .then(r => { setMachines(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchMachines(); }, []);

  // NEW: Delete handler
  const handleDelete = async (machine) => {
    try {
      await inventoryService.deleteMachine(machine.id);
      setConfirmDelete(null);
      fetchMachines();
      onEdit();
      showToast(`"${machine.name}" deleted successfully`);
    } catch (e) {
      setConfirmDelete(null);
      showToast(e.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const filtered = machines.filter(m => {
    const matchCat = filterCategory === 'All Categories' || m.category === filterCategory;
    const matchName = m.name.toLowerCase().includes(searchName.toLowerCase());
    const matchBrand = m.brand.toLowerCase().includes(searchBrand.toLowerCase());
    return matchCat && matchName && matchBrand;
  });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
      Loading machines...
    </div>
  );

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'error' ? '#dc2626' : '#16a34a',
          color: 'white', padding: '12px 20px', borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: '500', fontSize: '14px',
        }}>
          {toast.type === 'error' ? '❌ ' : '✅ '}{toast.msg}
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: 'white', borderRadius: '12px', padding: '20px 24px',
        marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px',
        border: '1px solid #e2e8f0',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
            CATEGORY
          </label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
              borderRadius: '8px', fontSize: '14px', color: '#0f172a',
              background: 'white', cursor: 'pointer', appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
            }}
          >
            {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
            EQUIPMENT NAME
          </label>
          <input
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder="Search equipment..."
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
              borderRadius: '8px', fontSize: '14px', color: '#0f172a', boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
            BRAND
          </label>
          <input
            value={searchBrand}
            onChange={e => setSearchBrand(e.target.value)}
            placeholder="Search brand..."
            style={{
              width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0',
              borderRadius: '8px', fontSize: '14px', color: '#0f172a', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Machine Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
        gap: '16px',
      }}>
        {filtered.map(machine => {
          const statusStyle = STATUS_STYLES[machine.status] || STATUS_STYLES.ACTIVE;
          // Low stock detection
          const qty = machine.quantity;
          const minLevel = machine.minimumLevel ?? 2;
          const isLowStock = qty !== undefined && qty !== null && qty < minLevel;

          return (
            <div key={machine.id} style={{
              background: 'white', borderRadius: '14px', overflow: 'hidden',
              boxShadow: isLowStock
                ? '0 0 0 2px #fca5a5, 0 1px 4px rgba(0,0,0,0.07)'
                : '0 1px 4px rgba(0,0,0,0.07)',
              border: isLowStock ? '1px solid #fca5a5' : '1px solid #e2e8f0',
              transition: 'box-shadow 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Low stock banner */}
              {isLowStock && (
                <div style={{
                  background: '#fef2f2', borderBottom: '1px solid #fecaca',
                  padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{ fontSize: '12px' }}>⚠️</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626' }}>
                    LOW STOCK — Only {qty} left
                  </span>
                </div>
              )}

              {/* Image Section */}
              <div style={{
                height: '140px', background: '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {machine.imageUrl ? (
                  <img
                    src={`http://localhost:8080/api/machines/image/${machine.imageUrl}`}
                    alt={machine.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px', boxSizing: 'border-box' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div style={{
                  display: machine.imageUrl ? 'none' : 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  width: '100%', height: '100%', fontSize: '48px', color: '#cbd5e1',
                }}>
                  🏋️
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                  {machine.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Brand:</span>
                  <span style={{
                    background: '#fefce8', border: '1px solid #fde047',
                    borderRadius: '4px', padding: '1px 8px',
                    fontSize: '12px', fontWeight: '700', color: '#713f12',
                  }}>
                    {machine.brand}
                  </span>
                </div>

                <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b' }}>
                  Model: <span style={{ color: '#0f172a', fontWeight: '500' }}>{machine.model}</span>
                </p>

                {/* Quantity with color coding */}
                {qty !== undefined && qty !== null && (
                  <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b' }}>
                    Quantity:{' '}
                    <span style={{ color: isLowStock ? '#dc2626' : '#16a34a', fontWeight: '700' }}>
                      {qty}
                    </span>
                    {isLowStock && (
                      <span style={{ fontSize: '11px', color: '#dc2626', marginLeft: '4px' }}>(Low)</span>
                    )}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Status:</span>
                  <span style={{
                    background: statusStyle.bg, color: statusStyle.color,
                    padding: '2px 10px', borderRadius: '20px',
                    fontSize: '12px', fontWeight: '600',
                  }}>
                    {statusStyle.label}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Edit + Delete */}
              <div style={{ display: 'flex', gap: '8px', padding: '0 16px 16px' }}>
                {canEdit ? (
                  <>
                    <button
                      onClick={() => setEditMachine(machine)}
                      style={{
                        flex: 1, padding: '8px', border: '1px solid #e2e8f0',
                        borderRadius: '8px', background: 'white', cursor: 'pointer',
                        fontSize: '13px', fontWeight: '600', color: '#475569',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                    >
                      ✏️ Edit Details
                    </button>
                    <button
                      onClick={() => setConfirmDelete(machine)}
                      style={{
                        flex: 1, padding: '8px', border: '1px solid #fecaca',
                        borderRadius: '8px', background: '#fef2f2', cursor: 'pointer',
                        fontSize: '13px', fontWeight: '600', color: '#dc2626',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}
                    >
                      🗑️ Delete
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Read only</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
          <p style={{ fontWeight: '500' }}>No machines found</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(2px)', padding: '12px',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px 32px',
            width: 'min(380px, 94vw)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              Delete Machine?
            </h3>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '14px' }}>
              Are you sure you want to delete <strong>"{confirmDelete.name}"</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  flex: 1, padding: '11px', background: '#dc2626', color: 'white',
                  border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1, padding: '11px', background: '#f1f5f9', color: '#475569',
                  border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editMachine && (
        <EditMachineModal
          machine={editMachine}
          onClose={() => setEditMachine(null)}
          onSaved={() => {
            setEditMachine(null);
            fetchMachines();
            onEdit();
            showToast('Machine updated successfully!');
          }}
        />
      )}
    </div>
  );
};

export default MachineGrid;
