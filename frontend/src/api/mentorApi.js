import api from './axios';

export const mentorApi = {
  getAll: (params) => api.get('/mentors', { params }),
  getById: (id) => api.get(`/mentors/${id}`),
  sendRequest: (mentorId, data) => api.post('/mentorship/requests', { mentorId, ...data }),
  getRequests: (params) => api.get('/mentorship/requests', { params }),
  updateRequest: (id, status) => api.patch(`/mentorship/requests/${id}`, { status }),
  getHistory: () => api.get('/mentorship/history'),
};
