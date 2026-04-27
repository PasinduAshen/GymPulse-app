import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================= AUTH SERVICE =================
export const authService = {
  register: (data) => api.post('/admin/register', data),
  login: (data) => api.post('/admin/login', data),
  forgotPassword: (email) => api.post('/admin/forgot-password', { email }),
  verifyCode: (email, code) => api.post('/admin/verify-code', { email, code }),
  resetPassword: (data) => api.post('/admin/reset-password', data),
  logout: () => localStorage.removeItem('token'),
};

export const managerInviteService = {
  createInvite: (data) => api.post('/admin/manager-invites', data),
  listInvites: () => api.get('/admin/manager-invites'),
  revokeInvite: (id) => api.post(`/admin/manager-invites/${id}/revoke`),
  validateInvite: (token) => api.get('/invites/validate', { params: { token } }),
  acceptInvite: (data) => api.post('/invites/accept', data),
};

// ================= AMC SERVICE =================
export const amcService = {
  uploadPdf: (formData) =>
    api.post('/amc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  extractDetails: (id) => api.post(`/amc/extract?amcId=${id}`),
  updateAmc: (id, data) => api.put(`/amc/${id}`, data),
  getAmcs: () => api.get('/amc/my-contracts'),
  getSchedules: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'All')
      params.append('status', filters.status.toUpperCase());
    if (filters.companyName) params.append('companyName', filters.companyName);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const query = params.toString();
    return api.get(`/amc/schedules${query ? `?${query}` : ''}`);
  },
  completeService: (id, notes) =>
    api.post(`/amc/schedules/${id}/complete`, { notes }),
  getServiceHistory: (amcId) => api.get(`/amc/contracts/${amcId}/history`),

  // From dev branch
  createInvoice: (amcId, data) => api.post(`/amc/${amcId}/payments/invoice`, data),
  recordPayment: (paymentId, data) => api.post(`/amc/payments/${paymentId}/receive`, data),
  getPayments: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.companyName) params.append('companyName', filters.companyName);
    if (filters.dueFrom) params.append('dueFrom', filters.dueFrom);
    if (filters.dueTo) params.append('dueTo', filters.dueTo);
    if (filters.outstandingOnly) params.append('outstandingOnly', 'true');
    const query = params.toString();
    return api.get(`/amc/payments${query ? `?${query}` : ''}`);
  },
  getOutstandingPayments: () => api.get('/amc/payments/outstanding'),
  getAmcPayments: (amcId) => api.get(`/amc/${amcId}/payments`),
};

// ================= INVENTORY SERVICE =================
export const inventoryService = {
  addMachine: (data) => api.post('/machines', data),
  getMachines: () => api.get('/machines'),
  getMachine: (id) => api.get(`/machines/${id}`),
  updateMachine: (id, data) => api.put(`/machines/${id}`, data),
  deleteMachine: (id) => api.delete(`/machines/${id}`),
  uploadMachineImage: (id, formData) =>
    api.post(`/machines/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  addSparePart: (data) => api.post('/spare-parts', data),
  getSpareParts: () => api.get('/spare-parts'),
  updateSparePart: (id, data) => api.put(`/spare-parts/${id}`, data),
  deleteSparePart: (id) => api.delete(`/spare-parts/${id}`),
  stockIn: (id, qty) => api.post(`/spare-parts/${id}/stock-in`, { quantity: qty }),
  stockOut: (id, qty) => api.post(`/spare-parts/${id}/stock-out`, { quantity: qty }),
  getLowStock: () => api.get('/spare-parts/low-stock'),
  uploadSparePartImage: (id, formData) =>
    api.post(`/spare-parts/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getStats: () => api.get('/inventory/stats'),
};

export default api;