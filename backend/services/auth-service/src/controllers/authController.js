const authService = require('../services/authService');

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const body = req.body || {};
    const { name, email, password, role } = body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    const result = await authService.registerUser({ name, email, password, role });
    res.status(201).json({ message: 'Registered successfully.', ...result });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Registration failed.' });
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

// GET /api/auth/profile (protected)
exports.getProfile = async (req, res) => {
  try {
    const profile = await authService.getProfileById(req.user.id);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get profile.' });
  }
};

// PUT /api/auth/profile (protected)
exports.updateProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const { name, avatar, bio } = body;
    const profile = await authService.updateProfileById(req.user.id, { name, avatar, bio });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update profile.' });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.json({ message: 'Logged out. Please remove the token on the client.' });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const body = req.body || {};
    const { email } = body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    const result = await authService.forgotPasswordForEmail(email);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Forgot password failed.' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const body = req.body || {};
    const { token, newPassword } = body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }
    const result = await authService.resetPasswordWithToken({ token, newPassword });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Reset password failed.' });
  }
};

// GET /api/auth/internal/user/:id - Internal endpoint for inter-service user lookups
exports.getUserById = async (req, res) => {
  try {
    const user = await authService.findUserById(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Failed to get user.' });
  }
};
