import api from './axios';

export const mentorApi = {
  getAll: (params) => api.get('/mentors', { params }),
  getById: (id) => api.get(`/mentors/${id}`),
  getReviews: (id) => api.get(`/mentors/${id}/reviews`),
  sendRequest: (mentorId, data) => api.post('/mentorship/requests', { mentorId, ...data }),
  getRequests: (params) => api.get('/mentorship/requests', { params }),
  updateRequest: (id, status) => api.patch(`/mentorship/requests/${id}`, { status }),
  getHistory: () => api.get('/mentorship/history'),
  getMyProfile: () => api.get('/mentors/me/profile'),
  upsertProfile: (data) => api.put('/mentors/profile', data),
  toggleAvailability: () => api.put('/mentors/availability'),
  adminSetVerification: (mentorProfileId, verified) =>
    api.put(`/mentors/${mentorProfileId}/verification`, { verified }),
};
