import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { amcService, authService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const initialInvoiceState = {
  amcId: '',
  invoiceNumber: '',
  invoiceDate: '',
  dueDate: '',
  amountDue: '',
  notes: '',
};

const initialReceiveState = {
  paymentId: null,
  amountReceived: '',
  paidDate: '',
  paymentMethod: '',
  notes: '',
};

const Payments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [amcs, setAmcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    status: 'All',
    machineName: '',
    brand: '',
    dueFrom: '',
    dueTo: '',
    outstandingOnly: false,
  });

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(initialInvoiceState);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveForm, setReceiveForm] = useState(initialReceiveState);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentsRes, amcsRes] = await Promise.all([
        amcService.getPayments(filters),
        amcService.getAmcs(),
      ]);
      setPayments(paymentsRes.data || []);
      setAmcs((amcsRes.data || []).filter((item) => item.status === 'ACTIVE' || item.status === 'EXPIRED'));
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        authService.logout();
        navigate('/login');
        return;
      }
      const msg = err.response?.data || err.message || 'Failed to load payments.';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  }, [filters, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const isAnyModalOpen = showInvoiceModal || showReceiveModal;
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showInvoiceModal, showReceiveModal]);

  const totalOutstanding = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.outstandingAmount || 0), 0).toFixed(2),
    [payments]
  );

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceForm.amcId) return;

    setInvoiceSubmitting(true);
    setError('');
    try {
      await amcService.createInvoice(invoiceForm.amcId, {
        invoiceNumber: invoiceForm.invoiceNumber || null,
        invoiceDate: invoiceForm.invoiceDate || null,
        dueDate: invoiceForm.dueDate,
        amountDue: Number(invoiceForm.amountDue),
        notes: invoiceForm.notes || null,
      });
      setShowInvoiceModal(false);
      setInvoiceForm(initialInvoiceState);
      fetchData();
    } catch (err) {
      const msg = err.response?.data || err.message || 'Failed to create invoice.';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const openReceiveModal = (paymentId) => {
    setReceiveForm({ ...initialReceiveState, paymentId });
    setShowReceiveModal(true);
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!receiveForm.paymentId) return;

    setReceiveSubmitting(true);
    setError('');
    try {
      await amcService.recordPayment(receiveForm.paymentId, {
        amountReceived: Number(receiveForm.amountReceived),
        paidDate: receiveForm.paidDate || null,
        paymentMethod: receiveForm.paymentMethod || null,
        notes: receiveForm.notes || null,
      });
      setShowReceiveModal(false);
      setReceiveForm(initialReceiveState);
      fetchData();
    } catch (err) {
      const msg = err.response?.data || err.message || 'Failed to record payment.';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setReceiveSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>AMC Payments</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Record received payments and track outstanding invoices.
          </p>
        </div>
        <button className="btn-add" onClick={() => setShowInvoiceModal(true)}>
          <svg style={{ width: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Create Invoice
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Outstanding Total:</strong> LKR {totalOutstanding}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={filters.outstandingOnly}
            onChange={(e) => setFilters((prev) => ({ ...prev, outstandingOnly: e.target.checked }))}
          />
          Show Outstanding Only
        </label>
      </div>

      <div className="card payments-filters-card" style={{ marginBottom: '1rem' }}>
        <div className="details-grid payments-filters-grid">
          <div className="form-group">
            <label>Status</label>
            <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
              <option>All</option>
              <option>UNPAID</option>
              <option>PARTIALLY_PAID</option>
              <option>PAID</option>
              <option>OVERDUE</option>
            </select>
          </div>
          <div className="form-group">
            <label>Machine</label>
            <input value={filters.machineName} onChange={(e) => setFilters((prev) => ({ ...prev, machineName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Brand</label>
            <input value={filters.brand} onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Due From</label>
            <input type="date" value={filters.dueFrom} onChange={(e) => setFilters((prev) => ({ ...prev, dueFrom: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Due To</label>
            <input type="date" value={filters.dueTo} onChange={(e) => setFilters((prev) => ({ ...prev, dueTo: e.target.value }))} />
          </div>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="data-card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Machine</th>
                <th>Due Date</th>
                <th>Amount Due</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading payments...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No payment records found.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.invoiceNumber}</td>
                    <td>{p.machineName || 'N/A'}</td>
                    <td>{p.dueDate}</td>
                    <td>LKR {Number(p.amountDue || 0).toFixed(2)}</td>
                    <td>LKR {Number(p.amountPaid || 0).toFixed(2)}</td>
                    <td>LKR {Number(p.outstandingAmount || 0).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${
                        p.status === 'PAID' ? 'status-active' :
                        p.status === 'OVERDUE' ? 'status-expired' :
                        p.status === 'PARTIALLY_PAID' ? 'status-extracted' : 'status-pending'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-small"
                        disabled={p.status === 'PAID'}
                        onClick={() => openReceiveModal(p.id)}
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInvoiceModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3>Create Payment Invoice</h3>
              <button className="close-btn" onClick={() => setShowInvoiceModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleInvoiceSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>AMC Contract</label>
                  <select required value={invoiceForm.amcId} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, amcId: e.target.value }))}>
                    <option value="">Select AMC Contract</option>
                    {amcs.map((amc) => (
                      <option key={amc.id} value={amc.id}>
                        {amc.machineName || 'Unknown'} ({amc.brand || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="details-grid">
                  <div className="form-group">
                    <label>Invoice Number (Optional)</label>
                    <input value={invoiceForm.invoiceNumber} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Amount Due</label>
                    <input required type="number" min="0.01" step="0.01" value={invoiceForm.amountDue} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, amountDue: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Invoice Date</label>
                    <input type="date" value={invoiceForm.invoiceDate} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoiceDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input required type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea rows="3" value={invoiceForm.notes} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowInvoiceModal(false)} disabled={invoiceSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={invoiceSubmitting}>{invoiceSubmitting ? 'Creating...' : 'Create Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReceiveModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Record Received Payment</h3>
              <button className="close-btn" onClick={() => setShowReceiveModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleReceiveSubmit}>
              <div className="modal-body">
                <div className="details-grid">
                  <div className="form-group">
                    <label>Amount Received</label>
                    <input required type="number" min="0.01" step="0.01" value={receiveForm.amountReceived} onChange={(e) => setReceiveForm((prev) => ({ ...prev, amountReceived: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Paid Date</label>
                    <input type="date" value={receiveForm.paidDate} onChange={(e) => setReceiveForm((prev) => ({ ...prev, paidDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <input value={receiveForm.paymentMethod} onChange={(e) => setReceiveForm((prev) => ({ ...prev, paymentMethod: e.target.value }))} placeholder="Cash / Bank Transfer / Cheque" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea rows="3" value={receiveForm.notes} onChange={(e) => setReceiveForm((prev) => ({ ...prev, notes: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowReceiveModal(false)} disabled={receiveSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={receiveSubmitting}>{receiveSubmitting ? 'Saving...' : 'Save Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .payments-filters-card {
          padding: 1rem 1rem 0.5rem;
        }
        .payments-filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.75rem 1rem;
        }
        .payments-filters-card .form-group {
          margin-bottom: 0.75rem;
        }
        .payments-filters-card .form-group label {
          margin-bottom: 0.35rem;
          font-size: 0.82rem;
        }
        .payments-filters-card .form-group input,
        .payments-filters-card .form-group select {
          padding: 0.65rem 0.85rem;
          font-size: 0.93rem;
          border-radius: 0.6rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(3px);
          overflow-y: auto;
          padding: 1rem;
        }
        .modal-content {
          background: #fff;
          border-radius: 12px;
          width: 92%;
          overflow: hidden;
          max-height: calc(100vh - 2rem);
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
        .modal-content form {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
        .modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.4rem;
          cursor: pointer;
          color: #64748b;
        }
        .modal-body {
          padding: 1.25rem 1.5rem;
          overflow-y: auto;
          min-height: 0;
        }
        .modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
      `}</style>
    </>
  );
};

export default Payments;
