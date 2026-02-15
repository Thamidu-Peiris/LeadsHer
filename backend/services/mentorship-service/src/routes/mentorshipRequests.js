const express = require('express');
const router = express.Router();
const { protect, role } = require('../middleware/auth');
const { validateMentorshipRequest } = require('../middleware/validation');
const mentorshipRequestController = require('../controllers/mentorshipRequestController');

router.use(protect);

router.post('/', validateMentorshipRequest, mentorshipRequestController.createMentorshipRequest);
router.get('/', mentorshipRequestController.getMentorshipRequests);
router.get('/:id', mentorshipRequestController.getMentorshipRequestById);
router.put('/:id/accept', role('Mentor'), mentorshipRequestController.acceptMentorshipRequest);
router.put('/:id/reject', role('Mentor'), mentorshipRequestController.rejectMentorshipRequest);
router.put('/:id/cancel', mentorshipRequestController.cancelMentorshipRequest);

module.exports = router;
