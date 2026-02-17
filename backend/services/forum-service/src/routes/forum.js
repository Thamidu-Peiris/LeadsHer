const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
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
} = require('../controllers/forumController');

// Topics
router.post('/topics', protect, validateTopic, createTopic);
router.get('/topics', optionalAuth, getTopics);
router.get('/my-topics', protect, getMyTopics);
router.get('/topics/:id', optionalAuth, getTopicById);
router.put('/topics/:id', protect, validateTopic, updateTopic);
router.delete('/topics/:id', protect, deleteTopic);

// Replies
router.post('/topics/:id/replies', protect, validateReply, createReply);
router.put('/replies/:id', protect, validateReply, updateReply);
router.delete('/replies/:id', protect, deleteReply);

// Voting & Reporting
router.post('/posts/:id/vote', protect, validateVote, votePost);
router.post('/posts/:id/report', protect, validateReport, reportPost);

module.exports = router;
