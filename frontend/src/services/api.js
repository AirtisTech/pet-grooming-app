import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  list: () => api.get('/orders'),
  available: () => api.get('/orders/available'),
  get: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
  cancel: (id) => api.delete(`/orders/${id}`),
  review: (id, data) => api.post(`/orders/${id}/review`, data),
};

// Groomers API
export const groomersAPI = {
  list: (params) => api.get('/groomers', { params }),
  profile: () => api.get('/groomers/profile'),
  updateProfile: (data) => api.put('/groomers/profile', data),
  getById: (id) => api.get(`/groomers/${id}`),
  accept: (orderId) => api.post(`/groomers/accept/${orderId}`),
  complete: (orderId) => api.post(`/groomers/complete/${orderId}`),
  setStatus: (isOnline) => api.post('/groomers/status', { isOnline }),
};
