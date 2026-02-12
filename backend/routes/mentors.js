const express = require('express');
const router = express.Router();
const { protect, role } = require('../middleware/auth');
const { validateMentorProfile, validateObjectId } = require('../middleware/validation');
const {
  createOrUpdateMentorProfile,
  getAllMentors,
  getMentorById,
  getMentorByUserId,
  getMyMentorProfile,
  toggleAvailability,
  getMentorStats,
} = require('../controllers/mentorController');
const {
  getMentorRecommendations,
  getSimilarMentorsById,
  checkMentorCompatibility,
} = require('../controllers/mentorMatchingController');

// Public routes
router.get('/', getAllMentors);
router.get('/recommendations', protect, getMentorRecommendations);
router.get('/:id', validateObjectId, getMentorById);
router.get('/:id/stats', validateObjectId, getMentorStats);
router.get('/:id/similar', validateObjectId, getSimilarMentorsById);
router.get('/:id/compatibility', protect, validateObjectId, checkMentorCompatibility);
router.get('/user/:userId', validateObjectId, getMentorByUserId);

// Protected routes (Mentor only)
router.post('/profile', protect, role('Mentor'), validateMentorProfile, createOrUpdateMentorProfile);
router.put('/profile', protect, role('Mentor'), validateMentorProfile, createOrUpdateMentorProfile);
router.get('/me/profile', protect, role('Mentor'), getMyMentorProfile);
router.put('/availability', protect, role('Mentor'), toggleAvailability);

module.exports = router;
