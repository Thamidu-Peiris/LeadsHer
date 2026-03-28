import api from './axios';

export const forumApi = {
  // Topics
  getTopics: (params) => api.get('/forum/topics', { params }),
  getMyTopics: (params) => api.get('/forum/my-topics', { params }),
  getTopicById: (id, params) => api.get(`/forum/topics/${id}`, { params }),
  createTopic: (data) => api.post('/forum/topics', data),
  updateTopic: (id, data) => api.put(`/forum/topics/${id}`, data),
  deleteTopic: (id) => api.delete(`/forum/topics/${id}`),

  // Topic actions
  pinTopic: (id) => api.put(`/forum/topics/${id}/pin`),
  closeTopic: (id) => api.put(`/forum/topics/${id}/close`),

  // Replies
  createReply: (topicId, content) => api.post(`/forum/topics/${topicId}/replies`, { content }),
  updateReply: (id, content) => api.put(`/forum/replies/${id}`, { content }),
  deleteReply: (id) => api.delete(`/forum/replies/${id}`),
  markAcceptedAnswer: (replyId) => api.put(`/forum/replies/${replyId}/accept`),

  // Voting
  vote: (postId, type, postType) => api.post(`/forum/posts/${postId}/vote`, { type, postType }),

  // Reporting
  report: (postId, postType, reason, description) =>
    api.post(`/forum/posts/${postId}/report`, { postType, reason, description }),

  // Admin: Reports
  getReports: (params) => api.get('/forum/reports', { params }),
  resolveReport: (reportId, action) => api.put(`/forum/reports/${reportId}`, { action }),
};
