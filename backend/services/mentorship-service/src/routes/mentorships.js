const express = require('express');
const router = express.Router();
const { protect, role } = require('../middleware/auth');
const { validateSession, validateGoals, validateFeedback } = require('../middleware/validation');
const mentorshipController = require('../controllers/mentorshipController');

router.use(protect);

// Admin mentorship operations
router.get('/admin/requests', role('admin'), mentorshipController.adminGetMentorshipRequests);
router.get('/admin/active', role('admin'), mentorshipController.adminGetActiveMentorships);
router.put('/admin/:id/terminate', role('admin'), mentorshipController.adminTerminateMentorship);
router.get('/admin/feedback', role('admin'), mentorshipController.adminGetFeedbackRatings);
router.get('/admin/reports', role('admin'), mentorshipController.adminGetReports);

router.get('/active', mentorshipController.getActiveMentorships);
router.get('/history', mentorshipController.getMentorshipHistory);
router.get('/:id', mentorshipController.getMentorshipById);
router.post('/:id/sessions', validateSession, mentorshipController.logMentorshipSession);
router.put('/:id/goals', validateGoals, mentorshipController.updateMentorshipGoals);
router.put('/:id/complete', mentorshipController.completeMentorship);
router.post('/:id/feedback', validateFeedback, mentorshipController.submitFeedback);
router.put('/:id/pause', mentorshipController.pauseMentorship);
router.put('/:id/resume', mentorshipController.resumeMentorship);
router.put('/:id/terminate', mentorshipController.terminateMentorship);

module.exports = router;
