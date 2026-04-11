import api from './axios';

export const storyApi = {
  getAll: (params) => api.get('/stories', { params }),
  getFeatured: () => api.get('/stories/featured'),
  getMine: (params) => api.get('/stories/mine', { params }),
  getMyLikedCount: () => api.get('/stories/liked/count'),
  getById: (id) => api.get(`/stories/${id}`),
  getByUser: (userId, params) => api.get(`/stories/user/${userId}`, { params }),
  uploadMedia: (formData) => api.post('/stories/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  create: (data) => api.post('/stories', data),
  update: (id, data) => api.put(`/stories/${id}`, data),
  delete: (id) => api.delete(`/stories/${id}`),
  toggleLike: (id) => api.post(`/stories/${id}/like`),
  getComments: (id, params) => api.get(`/stories/${id}/comments`, { params }),
  addComment: (id, content) => api.post(`/stories/${id}/comments`, { content }),
  deleteComment: (storyId, commentId) => api.delete(`/stories/${storyId}/comments/${commentId}`),
};
