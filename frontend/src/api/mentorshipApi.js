import api from './axios';

export const mentorshipApi = {
  // Requests
  getRequests:    (params) => api.get('/mentorship/requests', { params }),
  acceptRequest:  (id, body) => api.put(`/mentorship/requests/${id}/accept`, body || {}),
  rejectRequest:  (id, body) => api.put(`/mentorship/requests/${id}/reject`, body || {}),
  cancelRequest:  (id) => api.put(`/mentorship/requests/${id}/cancel`),

  // Mentorships
  getActive:      () => api.get('/mentorship/active'),
  getHistory:     () => api.get('/mentorship/history'),
  getById:        (id) => api.get(`/mentorship/${id}`),
  logSession:     (id, data) => api.post(`/mentorship/${id}/sessions`, data),
  updateGoals:    (id, data) => api.put(`/mentorship/${id}/goals`, data),
  complete:       (id) => api.put(`/mentorship/${id}/complete`),
  submitFeedback: (id, data) => api.post(`/mentorship/${id}/feedback`, data),
  pause:          (id) => api.put(`/mentorship/${id}/pause`),
  resume:         (id) => api.put(`/mentorship/${id}/resume`),
  terminate:      (id, reason) => api.put(`/mentorship/${id}/terminate`, { reason }),

  // Admin
  adminGetRequests: (params) => api.get('/mentorship/admin/requests', { params }),
  adminGetActive: () => api.get('/mentorship/admin/active'),
  adminTerminate: (id, reason) => api.put(`/mentorship/admin/${id}/terminate`, { reason }),
  adminGetFeedback: () => api.get('/mentorship/admin/feedback'),
  adminGetReports: () => api.get('/mentorship/admin/reports'),
};
