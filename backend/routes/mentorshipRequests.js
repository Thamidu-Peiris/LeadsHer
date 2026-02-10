const express = require('express');
const router = express.Router();
const { protect, role } = require('../middleware/auth');
const { validateMentorshipRequest, validateObjectId } = require('../middleware/validation');
const {
  createMentorshipRequest,
  getMentorshipRequests,
  getMentorshipRequestById,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
  cancelMentorshipRequest,
} = require('../controllers/mentorshipRequestController');

// All routes are protected
router.use(protect);

// Mentorship request routes
router.post('/', validateMentorshipRequest, createMentorshipRequest);
router.get('/', getMentorshipRequests);
router.get('/:id', validateObjectId, getMentorshipRequestById);

// Mentor actions
router.put('/:id/accept', validateObjectId, role('Mentor'), acceptMentorshipRequest);
router.put('/:id/reject', validateObjectId, role('Mentor'), rejectMentorshipRequest);

// Mentee actions
router.put('/:id/cancel', validateObjectId, cancelMentorshipRequest);

module.exports = router;
