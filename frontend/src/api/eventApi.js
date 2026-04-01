import api from './axios';

export const eventApi = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  getMyEvents: () => api.get('/events/my-events'),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.patch(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  register: (id) => api.post(`/events/${id}/register`),
  unregister: (id) => api.delete(`/events/${id}/unregister`),
  getAttendees: (id) => api.get(`/events/${id}/attendees`),
  submitFeedback: (id, data) => api.post(`/events/${id}/feedback`, data),
  issueCertificate: (id, userId) => api.patch(`/events/${id}/attendees/${userId}/certificate`),
};
