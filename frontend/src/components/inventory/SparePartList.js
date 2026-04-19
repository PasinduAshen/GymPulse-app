import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/api';

const SparePartList = ({ onEdit, canEdit = false }) => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockModal, setStockModal] = useState(null);
  const [stockQty, setStockQty] = useState(1);
  const [editPart, setEditPart] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchName, setSearchName] = useState('');

  const fetchParts = () => {
    inventoryService.getSpareParts()
      .then(r => { setParts(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(fetchParts, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openEdit = (p) => {
    setEditPart(p);
    setEditForm({ name: p.name, category: p.category || '', quantity: p.quantity, reorderLevel: p.reorderLevel, unitPrice: p.unitPrice });
    setEditImageFile(null);
    setEditImagePreview(p.imageUrl ? `http://localhost:8080/api/spare-parts/image/${p.imageUrl}` : null);
  };

  const handleEditSave = async () => {
    try {
      await inventoryService.updateSparePart(editPart.id, editForm);
      if (editImageFile) {
        const fd = new FormData();
        fd.append('image', editImageFile);
        await inventoryService.uploadSparePartImage(editPart.id, fd);
      }
      setEditPart(null);
      fetchParts();
      onEdit();
      showToast('Spare part updated successfully!');
    } catch (e) {
      showToast(e.response?.data?.error || 'Update failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this spare part?')) return;
    try {
      await inventoryService.deleteSparePart(id);
      fetchParts();
      onEdit();
      showToast('Spare part deleted');
    } catch (e) { showToast('Delete failed', 'error'); }
  };

  const handleStock = async () => {
    try {
      if (stockModal.type === 'in') await inventoryService.stockIn(stockModal.part.id, stockQty);
      else await inventoryService.stockOut(stockModal.part.id, stockQty);
      setStockModal(null);
      fetchParts();
      onEdit();
      showToast(`Stock ${stockModal.type === 'in' ? 'added' : 'removed'} successfully!`);
    } catch (e) { showToast(e.response?.data?.error || 'Stock update failed', 'error'); }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setEditImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const filtered = parts.filter(p => p.name.toLowerCase().includes(searchName.toLowerCase()));

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>Loading spare parts...
    </div>
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'error' ? '#dc2626' : '#16a34a',
          color: 'white', padding: '12px 20px', borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: '500', fontSize: '14px',
          animation: 'slideIn 0.3s ease',
        }}>
          {toast.type === 'error' ? '❌ ' : '✅ '}{toast.msg}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <input
          value={searchName} onChange={e => setSearchName(e.target.value)}
          placeholder="🔍  Search spare parts..."
          style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', width: '300px', boxSizing: 'border-box' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Image', 'Name', 'Category', 'Quantity', 'Reorder Lvl', 'Unit Price', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                {/* Image cell */}
                <td style={{ padding: '10px 16px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden',
                    background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e2e8f0',
                  }}>
                    {p.imageUrl ? (
                      <img
                        src={`http://localhost:8080/api/spare-parts/image/${p.imageUrl}`}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                      />
                    ) : null}
                    <span style={{ display: p.imageUrl ? 'none' : 'block', fontSize: '24px' }}>📦</span>
                  </div>
                </td>
                <td style={{ padding: '10px 16px', fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{p.name}</td>
                <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '14px' }}>{p.category || '—'}</td>
                <td style={{ padding: '10px 16px', fontWeight: '700', fontSize: '16px', color: p.lowStock ? '#dc2626' : '#0f172a' }}>{p.quantity}</td>
                <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '14px' }}>{p.reorderLevel}</td>
                <td style={{ padding: '10px 16px', fontSize: '14px', color: '#0f172a' }}>Rs. {parseFloat(p.unitPrice).toFixed(2)}</td>
                <td style={{ padding: '10px 16px' }}>
                  {p.lowStock
                    ? <span style={{ background: '#fef2f2', color: '#dc2626', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #fecaca' }}>⚠ LOW STOCK</span>
                    : <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #bbf7d0' }}>✓ OK</span>
                  }
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {canEdit ? (
                      <>
                        <button onClick={() => { setStockModal({ part: p, type: 'in' }); setStockQty(1); }}
                          style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                          + In
                        </button>
                        <button onClick={() => { setStockModal({ part: p, type: 'out' }); setStockQty(1); }}
                          style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                          − Out
                        </button>
                        <button onClick={() => openEdit(p)}
                          style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(p.id)}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                          Del
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Read only</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
            <p style={{ fontWeight: '500' }}>No spare parts found</p>
          </div>
        )}
      </div>

      {/* Stock Modal */}
      {stockModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px 32px', width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
              {stockModal.type === 'in' ? '➕ Stock In' : '➖ Stock Out'}
            </h3>
            <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: '14px' }}>
              <strong>{stockModal.part.name}</strong> · Current stock: <strong>{stockModal.part.quantity}</strong>
            </p>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Quantity</label>
            <input
              type="number" min="1" value={stockQty} onChange={e => setStockQty(parseInt(e.target.value) || 1)}
              style={{ width: '100%', padding: '10px 13px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '16px', fontWeight: '600', boxSizing: 'border-box', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleStock} style={{
                flex: 1, padding: '11px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: stockModal.type === 'in' ? '#16a34a' : '#ea580c', color: 'white', fontWeight: '700', fontSize: '14px',
              }}>
                Confirm
              </button>
              <button onClick={() => setStockModal(null)} style={{ flex: 1, padding: '11px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', color: '#475569' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editPart && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px 32px', width: '480px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: '700', fontSize: '18px' }}>Edit Spare Part</h3>
              <button onClick={() => setEditPart(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>✕</button>
            </div>

            {/* Image update */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Part Image</label>
              <div onClick={() => document.getElementById(`ep-img-${editPart.id}`).click()}
                style={{ border: `2px dashed ${editImagePreview ? '#2563eb' : '#cbd5e1'}`, borderRadius: '10px', padding: '14px', cursor: 'pointer', textAlign: 'center', background: editImagePreview ? '#eff6ff' : '#f8fafc' }}>
                {editImagePreview ? (
                  <div>
                    <img src={editImagePreview} alt="preview" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#2563eb' }}>Click to change</p>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>📸 Upload image</p>
                )}
              </div>
              <input id={`ep-img-${editPart.id}`} type="file" accept="image/*" onChange={handleEditImageChange} style={{ display: 'none' }} />
            </div>

            {[['name','Part Name *'], ['category','Category']].map(([f, label]) => (
              <div key={f} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>{label}</label>
                <input value={editForm[f]} onChange={e => setEditForm({ ...editForm, [f]: e.target.value })}
                  style={{ width: '100%', padding: '10px 13px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              {[['quantity','Quantity'], ['reorderLevel','Reorder Lvl'], ['unitPrice','Unit Price']].map(([f, label]) => (
                <div key={f}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>{label}</label>
                  <input type="number" min="0" step={f === 'unitPrice' ? '0.01' : '1'} value={editForm[f]}
                    onChange={e => setEditForm({ ...editForm, [f]: f === 'unitPrice' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={handleEditSave} style={{ flex: 1, padding: '11px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                Save Changes
              </button>
              <button onClick={() => setEditPart(null)} style={{ flex: 1, padding: '11px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SparePartList;