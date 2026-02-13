const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const body = req.body || {};
    const { name, email, password, role } = body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Mentee',
    });
    const token = signToken(user._id);
    res.status(201).json({
      message: 'Registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Registration failed.' });
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
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = signToken(user._id);
    res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Login failed.' });
  }
};

// GET /api/auth/profile (protected)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to get profile.' });
  }
};

// PUT /api/auth/profile (protected)
exports.updateProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const { name, avatar, bio } = body;
    const allowed = { name, avatar, bio };
    Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);
    const user = await User.findByIdAndUpdate(req.user.id, allowed, {
      new: true,
      runValidators: true,
    });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to update profile.' });
  }
};

// POST /api/auth/logout (client discards token; optional: blacklist token later)
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
    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) {
      return res.json({ message: 'If an account exists, a reset link will be sent.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save({ validateBeforeSave: false });

    // TODO: Send email with reset link, e.g. https://yourapp.com/reset-password?token=resetToken
    // For now return token only for development (do NOT do this in production)
    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        message: 'Reset token generated (dev only). Use POST /api/auth/reset-password with token.',
        resetToken,
        expiresIn: '10 minutes',
      });
    }
    res.json({ message: 'If an account exists, a reset link will be sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Forgot password failed.' });
  }
};

// POST /api/auth/reset-password (optional; use with token from forgot-password)
exports.resetPassword = async (req, res) => {
  try {
    const body = req.body || {};
    const { token, newPassword } = body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password +resetPasswordToken +resetPasswordExpires');
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    const jwtToken = signToken(user._id);
    res.json({ message: 'Password reset successfully.', token: jwtToken });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Reset password failed.' });
  }
};
