import React, { useState } from 'react';
import { inventoryService } from '../../services/api';

const AddSparePartModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ name: '', category: '', quantity: 0, reorderLevel: 0, unitPrice: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrors(p => ({ ...p, image: 'Please select an image file' })); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors(p => ({ ...p, image: 'Image must be under 5MB' })); return; }
    setImageFile(file);
    setErrors(p => ({ ...p, image: null }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.quantity < 0) e.quantity = 'Must be ≥ 0';
    if (form.reorderLevel < 0) e.reorderLevel = 'Must be ≥ 0';
    if (form.unitPrice < 0) e.unitPrice = 'Must be ≥ 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await inventoryService.addSparePart(form);
      const partId = res.data.id;
      if (imageFile && partId) {
        const fd = new FormData();
        fd.append('image', imageFile);
        await inventoryService.uploadSparePartImage(partId, fd);
      }
      onSaved();
    } catch (e) {
      setErrors({ submit: e.response?.data?.error || e.response?.data || 'Something went wrong' });
    } finally { setLoading(false); }
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '10px 13px', border: `1px solid ${errors[field] ? '#fca5a5' : '#e2e8f0'}`,
    borderRadius: '8px', fontSize: '14px', color: '#0f172a', boxSizing: 'border-box',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)',
      padding: '12px',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '28px 32px',
        width: 'min(520px, 96vw)', maxHeight: 'calc(100vh - 24px)', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Add Spare Part</h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>Fill in the spare part details</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>✕</button>
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Part Image</label>
          <div
            onClick={() => document.getElementById('part-img-input').click()}
            style={{
              border: `2px dashed ${imagePreview ? '#2563eb' : '#cbd5e1'}`,
              borderRadius: '12px', padding: '20px', cursor: 'pointer',
              textAlign: 'center', background: imagePreview ? '#eff6ff' : '#f8fafc', transition: 'all 0.2s',
            }}
          >
            {imagePreview ? (
              <div>
                <img src={imagePreview} alt="Preview" style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>Click to change image</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📸</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Click to upload part image</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>PNG, JPG, WEBP up to 5MB</p>
              </div>
            )}
          </div>
          <input id="part-img-input" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          {errors.image && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.image}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Part Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Drive Belt" style={inputStyle('name')} />
            {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.name}</p>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Category</label>
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Belts" style={inputStyle('category')} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Quantity *</label>
            <input type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} style={inputStyle('quantity')} />
            {errors.quantity && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.quantity}</p>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Reorder Level *</label>
            <input type="number" min="0" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })} style={inputStyle('reorderLevel')} />
            {errors.reorderLevel && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.reorderLevel}</p>}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Unit Price (Rs.)</label>
            <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} style={inputStyle('unitPrice')} />
            {errors.unitPrice && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors.unitPrice}</p>}
          </div>
        </div>

        {errors.submit && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginTop: '16px' }}>
            <p style={{ margin: 0, color: '#dc2626', fontSize: '13px' }}>{errors.submit}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: '11px', background: loading ? '#93c5fd' : '#2563eb',
            color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Saving...' : 'Add Spare Part'}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSparePartModal;