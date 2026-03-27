const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  createStory,
  getAllStories,
  getFeaturedStories,
  getStoriesByUser,
  getMyStories,
  getStoryById,
  updateStory,
  deleteStory,
  toggleLike,
  getStoryComments,
  addStoryComment,
  uploadStoryMedia,
} = require('../controllers/storyController');

// Public (featured and user stories must come before /:id)
router.get('/featured', getFeaturedStories);
router.get('/user/:userId', getStoriesByUser);
router.get('/mine', protect, getMyStories);
router.get('/', optionalAuth, getAllStories);
router.get('/:id/comments', getStoryComments);
router.get('/:id', optionalAuth, getStoryById);

// Protected
router.post('/', protect, createStory);
router.post('/upload', protect, upload.single('media'), uploadStoryMedia);
router.put('/:id', protect, updateStory);
router.delete('/:id', protect, deleteStory);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addStoryComment);

module.exports = router;
