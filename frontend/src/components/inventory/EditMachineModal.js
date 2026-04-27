import React, { useState } from 'react';
import { inventoryService } from '../../services/api';

const CATEGORIES = ['Cardio', 'Strength', 'Free Weights', 'Flexibility', 'Other'];

const EditMachineModal = ({ machine, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: machine.name || '',
    brand: machine.brand || '',
    model: machine.model || '',
    category: machine.category || '',
    purchaseDate: machine.purchaseDate || '',
    status: machine.status || 'ACTIVE',
    quantity: machine.quantity ?? 1,
    // minimumLevel ain kala
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    machine.imageUrl ? `http://localhost:8080/api/machines/image/${machine.imageUrl}` : null
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please select an image file' }));
      return;
    }
    setImageFile(file);
    setErrors(prev => ({ ...prev, image: null }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Machine name is required';
    if (!form.brand.trim()) e.brand = 'Brand is required';
    if (!form.model.trim()) e.model = 'Model is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await inventoryService.updateMachine(machine.id, form);
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await inventoryService.uploadMachineImage(machine.id, formData);
      }
      onSaved();
    } catch (e) {
      setErrors({ submit: e.response?.data?.error || e.response?.data || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '10px 13px', border: `1px solid ${errors[field] ? '#fca5a5' : '#e2e8f0'}`,
    borderRadius: '8px', fontSize: '14px', color: '#0f172a', boxSizing: 'border-box',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000,
      padding: '12px',
      backdropFilter: 'blur(2px)',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '28px 32px',
        width: 'min(520px, 96vw)', maxHeight: 'calc(100vh - 24px)', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Edit Machine</h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>Update machine details</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>✕</button>
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
            Machine Image
          </label>
          <div
            onClick={() => document.getElementById(`edit-img-${machine.id}`).click()}
            style={{
              border: `2px dashed ${imagePreview ? '#2563eb' : '#cbd5e1'}`,
              borderRadius: '12px', padding: '16px', cursor: 'pointer',
              textAlign: 'center', background: imagePreview ? '#eff6ff' : '#f8fafc',
            }}
          >
            {imagePreview ? (
              <div>
                <img src={imagePreview} alt="Preview"
                  style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                />
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>Click to change</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '30px', marginBottom: '6px' }}>📸</div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Upload machine image</p>
              </div>
            )}
          </div>
          <input id={`edit-img-${machine.id}`} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
        </div>

        {/* Form Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {[
            { key: 'name', label: 'Machine Name *', placeholder: 'Machine name' },
            { key: 'brand', label: 'Brand *', placeholder: 'Brand' },
            { key: 'model', label: 'Model *', placeholder: 'Model' },
            { key: 'category', label: 'Category', type: 'select' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>{label}</label>
              {type === 'select' ? (
                <select value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ ...inputStyle(key), background: 'white' }}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              ) : (
                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} style={inputStyle(key)} />
              )}
              {errors[key] && <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0' }}>{errors[key]}</p>}
            </div>
          ))}
        </div>

        {/* Purchase Date + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Purchase Date</label>
            <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} style={inputStyle('purchaseDate')} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Status *</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle('status'), background: 'white' }}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Quantity (Full Width) */}
        <div style={{ marginTop: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
            Quantity
          </label>
          <input
            type="number" min="0" value={form.quantity}
            onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
            style={inputStyle('quantity')}
          />
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
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', background: '#f1f5f9', color: '#475569',
            border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMachineModal;