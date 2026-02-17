const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
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
router.post('/register', validateRegister, authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/google', authController.google);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', validatePassword, authController.resetPassword);

// Protected
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, validateBio, optionalProfilePicture, authController.updateProfile);
router.post('/logout', protect, authController.logout);

// Internal endpoint for inter-service communication
router.get('/internal/user/:id', authController.getUserById);

module.exports = router;
