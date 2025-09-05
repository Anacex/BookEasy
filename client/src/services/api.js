import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
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

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyOTP: (userId, otp) => api.post('/auth/verify-otp', { userId, otp }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (identifier) => api.post('/auth/forgot-password', { identifier }),
  resetPassword: (userId, otp, newPassword) => 
    api.post('/auth/reset-password', { userId, otp, newPassword }),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
};

// Providers API
export const providersAPI = {
  search: (params) => api.get('/providers/search', { params }),
  getById: (id) => api.get(`/providers/${id}`),
  getAvailability: (id, params) => api.get(`/providers/${id}/availability`, { params }),
  register: (providerData) => api.post('/providers/register', providerData),
  updateProfile: (profileData) => api.put('/providers/profile', profileData),
  updateAvailability: (availabilityData) => api.put('/providers/availability', availabilityData),
  getDashboardStats: () => api.get('/providers/dashboard/stats'),
};

// Bookings API
export const bookingsAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getCustomerBookings: (params) => api.get('/bookings/customer', { params }),
  getProviderBookings: (params) => api.get('/bookings/provider', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, statusData) => api.put(`/bookings/${id}/status`, statusData),
  cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  reschedule: (id, rescheduleData) => api.put(`/bookings/${id}/reschedule`, rescheduleData),
};

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (bookingId) => api.post('/payments/create-payment-intent', { bookingId }),
  confirmPayment: (paymentIntentId) => api.post('/payments/confirm-payment', { paymentIntentId }),
  getHistory: (params) => api.get('/payments/history', { params }),
  processRefund: (bookingId, reason) => api.post('/payments/refund', { bookingId, reason }),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getProviders: (params) => api.get('/admin/providers', { params }),
  verifyProvider: (id, isVerified) => api.put(`/admin/providers/${id}/verify`, { isVerified }),
  updateUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  getBookings: (params) => api.get('/admin/bookings', { params }),
};

export default api;