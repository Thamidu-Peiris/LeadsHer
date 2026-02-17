const authService = require('../services/authService');
const { getGooglePayload } = require('../services/googleAuth');
const { getCloudinary } = require('../config/cloudinary');

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const body = req.body || {};
    const { name, email, password, role } = body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    const result = await authService.registerUser({ name, email, password, role });
    res.status(201).json({ message: 'Registered successfully. Please verify your email.', ...result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Registration failed.' });
  }
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  try {
    const token = req.body?.token || req.query?.token;
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' });
    }
    const result = await authService.verifyEmail(token);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Verification failed.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const body = req.body || {};
    const { email, password } = body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const result = await authService.loginUser({ email, password });
    res.json({ message: 'Logged in successfully.', ...result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Login failed.' });
  }
};

// POST /api/auth/google - body: { idToken } from Google Sign-In
exports.google = async (req, res) => {
  try {
    const idToken = req.body?.idToken || req.body?.token;
    if (!idToken) {
      return res.status(400).json({ message: 'Google idToken is required.' });
    }
    const payload = await getGooglePayload(idToken);
    const result = await authService.findOrCreateGoogleUser(payload);
    res.json({ message: 'Logged in with Google.', ...result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Google login failed.' });
  }
};

// GET /api/auth/profile (protected)
exports.getProfile = async (req, res) => {
  try {
    const profile = await authService.getProfileById(req.user.id);
    res.json(profile);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get profile.' });
  }
};

// PUT /api/auth/profile (protected) - optional multipart with profilePicture file
exports.updateProfile = async (req, res) => {
  try {
    const body = req.body || {};
    let profilePictureUrl = body.profilePicture;
    if (req.file) {
      const cloudinary = getCloudinary();
      if (cloudinary) {
        const result = await new Promise((resolve, reject) => {
          const opts = { folder: 'leadsher/profiles' };
          cloudinary.uploader.upload_stream(opts, (err, res) => (err ? reject(err) : resolve(res))).end(req.file.buffer);
        });
        profilePictureUrl = result.secure_url;
      } else {
        return res.status(503).json({ message: 'Profile picture upload is not configured (Cloudinary).' });
      }
    }
    let expertise = body.expertise;
    if (typeof expertise === 'string') {
      try {
        expertise = JSON.parse(expertise);
      } catch {
        expertise = expertise.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    const updates = {
      name: body.name,
      bio: body.bio,
      expertise: Array.isArray(expertise) ? expertise : undefined,
      industry: body.industry,
      experienceLevel: body.experienceLevel,
      linkedin: body.linkedin,
      location: body.location,
      role: body.role,
      privacy: typeof body.privacy === 'object' ? body.privacy : undefined,
    };
    const profile = await authService.updateProfileById(req.user.id, updates, profilePictureUrl);
    res.json(profile);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to update profile.' });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.json({ message: 'Logged out. Please remove the token on the client.' });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body?.email;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    const result = await authService.forgotPasswordForEmail(email);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Forgot password failed.' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const body = req.body || {};
    const token = body.token || body.resetToken;
    const newPassword = body.newPassword || body.password;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }
    const result = await authService.resetPasswordWithToken({ token, newPassword });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Reset password failed.' });
  }
};

// GET /api/auth/internal/user/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await authService.findUserById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get user.' });
  }
};
