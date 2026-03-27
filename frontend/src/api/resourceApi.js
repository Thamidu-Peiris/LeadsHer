import api from './axios';

export const resourceApi = {
  getAll: (params) => api.get('/resources', { params }),
  getById: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post('/resources', data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
  toggleBookmark: (id) => api.post(`/resources/${id}/bookmark`),
  trackDownload: (id) => api.post(`/resources/${id}/download`),
  rate: (id, data) => api.post(`/resources/${id}/rate`, data),
  getBookmarks: (params) => api.get('/resources/bookmarks', { params }),
  getRecommended: (params) => api.get('/resources/recommended', { params }),
  getMyResources: (params) => api.get('/resources/my', { params }),
  uploadFile: (formData) =>
    api.post('/resources/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // Admin
  adminGetAll: (params) => api.get('/resources/admin/all', { params }),
  adminGetAnalytics: () => api.get('/resources/admin/analytics'),
  approve: (id) => api.patch(`/resources/${id}/approve`),
  reject: (id) => api.patch(`/resources/${id}/reject`),
};
