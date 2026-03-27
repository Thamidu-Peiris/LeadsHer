const express = require('express');
const router = express.Router();
const { protect, optionalAuth, role } = require('../middleware/auth');
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
  getMyResources,
  adminGetAllResources,
  adminGetAnalytics,
  approveResource,
  rejectResource,
} = require('../controllers/resourceController');

// Public
router.get('/', getAllResources);

// Admin-only (must be before /:id routes)
router.get('/admin/all', protect, role('admin', 'Admin'), adminGetAllResources);
router.get('/admin/analytics', protect, role('admin', 'Admin'), adminGetAnalytics);

// Protected (must be before /:id routes)
router.get('/bookmarks', protect, getUserBookmarks);
router.get('/recommended', protect, getRecommendedResources);
router.get('/my', protect, getMyResources);
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
router.patch('/:id/approve', protect, role('admin', 'Admin'), approveResource);
router.patch('/:id/reject', protect, role('admin', 'Admin'), rejectResource);

module.exports = router;
