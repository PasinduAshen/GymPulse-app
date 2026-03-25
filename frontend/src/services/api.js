import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
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

export const authService = {
  register: (data) => api.post('/admin/register', data),
  login: (data) => api.post('/admin/login', data),
  forgotPassword: (email) => api.post('/admin/forgot-password', { email }),
  verifyCode: (email, code) => api.post('/admin/verify-code', { email, code }),
  resetPassword: (data) => api.post('/admin/reset-password', data),
  logout: () => localStorage.removeItem('token'),
};

export const amcService = {
  uploadPdf: (formData) => api.post('/amc/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  extractDetails: (id) => api.post(`/amc/extract?amcId=${id}`),
  updateAmc: (id, data) => api.put(`/amc/${id}`, data),
  getAmcs: () => api.get('/amc/my-contracts'),
  getSchedules: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'All') params.append('status', filters.status.toUpperCase());
    if (filters.machineName) params.append('machineName', filters.machineName);
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const query = params.toString();
    return api.get(`/amc/schedules${query ? `?${query}` : ''}`);
  },
  completeService: (id, notes) => api.post(`/amc/schedules/${id}/complete`, { notes }),
  getServiceHistory: (amcId) => api.get(`/amc/contracts/${amcId}/history`),
};

export default api;
