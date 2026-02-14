const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  createStory,
  getAllStories,
  getStoryById,
  updateStory,
  deleteStory,
  toggleLike,
  uploadStoryImage,
} = require('../controllers/storyController');

// Public
router.get('/', getAllStories);
router.get('/:id', optionalAuth, getStoryById);

// Protected
router.post('/', protect, createStory);
router.post('/upload', protect, upload.single('image'), uploadStoryImage);
router.put('/:id', protect, updateStory);
router.delete('/:id', protect, deleteStory);
router.post('/:id/like', protect, toggleLike);

module.exports = router;
