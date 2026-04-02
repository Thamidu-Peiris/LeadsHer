import api from './axios';

export const eventApi = {
  // Public
  getAll:            (params) => api.get('/events', { params }),
  getById:           (id) => api.get(`/events/${id}`),

  // Authenticated — my events
  getMyEvents:       () => api.get('/events/my-events'),
  getMyCreatedEvents:() => api.get('/events/my-created'),

  // CRUD (mentor / admin)
  create:            (data) => api.post('/events', data),
  update:            (id, data) => api.patch(`/events/${id}`, data),
  delete:            (id) => api.delete(`/events/${id}`),

  // Registration
  register:          (id) => api.post(`/events/${id}/register`),
  unregister:        (id) => api.delete(`/events/${id}/unregister`),
  getAttendees:      (id) => api.get(`/events/${id}/attendees`),

  // Feedback
  submitFeedback:    (id, data) => api.post(`/events/${id}/feedback`, data),

  // Admin + event-owner
  cancelEvent:       (id) => api.patch(`/events/${id}/cancel`),

  // Admin-only
  rescheduleEvent:   (id, data) => api.patch(`/events/${id}/reschedule`, data),
  issueCertificates: (id) => api.post(`/events/${id}/certificates`),
  getEventCertificates: (id) => api.get(`/events/${id}/certificates`),
};
