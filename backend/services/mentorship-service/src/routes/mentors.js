const express = require('express');
const router = express.Router();
const { protect, role } = require('../middleware/auth');
const { validateMentorProfile } = require('../middleware/validation');
const mentorController = require('../controllers/mentorController');
const mentorMatchingController = require('../controllers/mentorMatchingController');

// Public routes
router.get('/', mentorController.getAllMentors);
router.get('/recommendations', protect, mentorMatchingController.getMentorRecommendations);
router.get('/:id', mentorController.getMentorById);
router.get('/:id/stats', mentorController.getMentorStats);
router.get('/:id/similar', mentorMatchingController.getSimilarMentorsById);
router.get('/:id/compatibility', protect, mentorMatchingController.checkMentorCompatibility);
router.get('/user/:userId', mentorController.getMentorByUserId);

// Protected routes
router.post('/profile', protect, role('mentor'), validateMentorProfile, mentorController.createOrUpdateMentorProfile);
router.put('/profile', protect, role('mentor'), validateMentorProfile, mentorController.createOrUpdateMentorProfile);
router.get('/me/profile', protect, role('mentor'), mentorController.getMyMentorProfile);
router.put('/availability', protect, role('mentor'), mentorController.toggleAvailability);

module.exports = router;
