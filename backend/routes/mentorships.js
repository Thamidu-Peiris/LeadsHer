const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  validateSession,
  validateFeedback,
  validateGoals,
  validateObjectId,
} = require('../middleware/validation');
const {
  getActiveMentorships,
  getMentorshipById,
  logMentorshipSession,
  updateMentorshipGoals,
  completeMentorship,
  submitFeedback,
  pauseMentorship,
  resumeMentorship,
  terminateMentorship,
  getMentorshipHistory,
} = require('../controllers/mentorshipController');

// All routes are protected
router.use(protect);

// Mentorship management routes
router.get('/active', getActiveMentorships);
router.get('/history', getMentorshipHistory);
router.get('/:id', validateObjectId, getMentorshipById);

// Mentorship actions
router.post('/:id/sessions', validateObjectId, validateSession, logMentorshipSession);
router.put('/:id/goals', validateObjectId, validateGoals, updateMentorshipGoals);
router.put('/:id/complete', validateObjectId, completeMentorship);
router.post('/:id/feedback', validateObjectId, validateFeedback, submitFeedback);
router.put('/:id/pause', validateObjectId, pauseMentorship);
router.put('/:id/resume', validateObjectId, resumeMentorship);
router.put('/:id/terminate', validateObjectId, terminateMentorship);

module.exports = router;
