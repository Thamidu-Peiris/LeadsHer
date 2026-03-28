const express = require('express');
const router = express.Router();
const { protect, role, optionalAuth } = require('../middleware/auth');
const { validateTopic, validateReply, validateVote, validateReport } = require('../middleware/validation');
const {
  createTopic,
  getTopics,
  getMyTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
  createReply,
  updateReply,
  deleteReply,
  votePost,
  reportPost,
  markAcceptedAnswer,
  togglePin,
  toggleClose,
  getReports,
  resolveReport,
} = require('../controllers/forumController');

// Topics
router.post('/topics', protect, validateTopic, createTopic);
router.get('/topics', optionalAuth, getTopics);
router.get('/my-topics', protect, getMyTopics);
router.get('/topics/:id', optionalAuth, getTopicById);
router.put('/topics/:id', protect, validateTopic, updateTopic);
router.delete('/topics/:id', protect, deleteTopic);

// Topic actions
router.put('/topics/:id/pin', protect, role('Admin'), togglePin);
router.put('/topics/:id/close', protect, role('Mentor', 'Admin'), toggleClose);

// Replies
router.post('/topics/:id/replies', protect, validateReply, createReply);
router.put('/replies/:id', protect, validateReply, updateReply);
router.delete('/replies/:id', protect, deleteReply);
router.put('/replies/:id/accept', protect, role('Mentor', 'Admin'), markAcceptedAnswer);

// Voting & Reporting
router.post('/posts/:id/vote', protect, validateVote, votePost);
router.post('/posts/:id/report', protect, validateReport, reportPost);

// Reports management (Admin only)
router.get('/reports', protect, role('Admin'), getReports);
router.put('/reports/:id', protect, role('Admin'), resolveReport);

module.exports = router;
