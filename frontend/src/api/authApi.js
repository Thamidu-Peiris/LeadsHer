import api from './axios';

export const authApi = {
  getRegistrationConfig: () => api.get('/auth/registration-config'),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  /** Body: { token } from email link, or { email, code } for 6-digit code */
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updateProfileMultipart: (formData) =>
    api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  // Admin
  adminUpdateAppSettings: (data) => api.put('/auth/admin/settings', data),
  adminListUsers: (params) => api.get('/auth/admin/users', { params }),
  adminUpdateUserProfile: (id, data) => api.put(`/auth/admin/users/${id}/profile`, data),
  adminSetUserRole: (id, role) => api.put(`/auth/admin/users/${id}/role`, { role }),
  adminSetSuspension: (id, suspended, reason = '') =>
    api.put(`/auth/admin/users/${id}/suspension`, { suspended, reason }),
};
