const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
  toggleBookmark,
  getUserBookmarks,
  trackDownload,
  rateResource,
  getRecommendedResources,
  uploadResourceFile,
} = require('../controllers/resourceController');

// Public
router.get('/', getAllResources);

// Protected (must be before /:id routes)
router.get('/bookmarks', protect, getUserBookmarks);
router.get('/recommended', protect, getRecommendedResources);
router.post('/upload', protect, upload.single('file'), uploadResourceFile);

// Public with optional auth
router.get('/:id', optionalAuth, getResourceById);

// Protected
router.post('/', protect, createResource);
router.put('/:id', protect, updateResource);
router.delete('/:id', protect, deleteResource);
router.post('/:id/bookmark', protect, toggleBookmark);
router.post('/:id/download', protect, trackDownload);
router.post('/:id/rate', protect, rateResource);

module.exports = router;
