const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, role } = require('../middleware/auth');
const { validateRegister, validatePassword, validateBio } = require('../middleware/validation');
const { uploadProfilePicture } = require('../middleware/upload');

// Optional multipart: only run multer when Content-Type is multipart
const optionalProfilePicture = (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('multipart/form-data')) {
    return uploadProfilePicture(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message || 'Invalid file.' });
      next();
    });
  }
  next();
};

// Public
router.get('/registration-config', authController.registrationConfig);
router.post('/register', validateRegister, authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/google', authController.google);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', validatePassword, authController.resetPassword);

// Protected
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, validateBio, optionalProfilePicture, authController.updateProfile);
router.post('/logout', protect, authController.logout);

// Internal endpoint for inter-service communication
router.get('/internal/user/:id', authController.getUserById);

// Admin routes
router.get('/admin/users', protect, role('admin'), authController.adminListUsers);
router.put('/admin/users/:id/profile', protect, role('admin'), authController.adminUpdateUserProfile);
router.put('/admin/users/:id/role', protect, role('admin'), authController.adminSetUserRole);
router.put('/admin/users/:id/suspension', protect, role('admin'), authController.adminSetSuspension);
router.put('/admin/settings', protect, role('admin'), authController.adminUpdateSettings);

module.exports = router;
