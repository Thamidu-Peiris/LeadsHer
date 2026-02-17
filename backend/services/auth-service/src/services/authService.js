const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const registerUser = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('User already exists with this email.');
    err.status = 400;
    throw err;
  }
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'Mentee',
  });
  const token = signToken(user._id);
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
    },
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }
  const token = signToken(user._id);
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
    },
  };
};

const getProfileById = async (userId) => {
  const user = await User.findById(userId);
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
  };
};

const updateProfileById = async (userId, { name, avatar, bio }) => {
  const allowed = { name, avatar, bio };
  Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k]);
  const user = await User.findByIdAndUpdate(userId, allowed, {
    new: true,
    runValidators: true,
  });
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
  };
};

const forgotPasswordForEmail = async (email) => {
  const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');
  if (!user) {
    return { message: 'If an account exists, a reset link will be sent.' };
  }
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  if (process.env.NODE_ENV !== 'production') {
    return {
      message: 'Reset token generated (dev only). Use POST /api/auth/reset-password with token.',
      resetToken,
      expiresIn: '10 minutes',
    };
  }
  return { message: 'If an account exists, a reset link will be sent to your email.' };
};

const resetPasswordWithToken = async ({ token, newPassword }) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');
  if (!user) {
    const err = new Error('Invalid or expired reset token.');
    err.status = 400;
    throw err;
  }
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  const jwtToken = signToken(user._id);
  return { message: 'Password reset successfully.', token: jwtToken };
};

const findUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
  };
};

module.exports = {
  signToken,
  registerUser,
  loginUser,
  getProfileById,
  updateProfileById,
  forgotPasswordForEmail,
  resetPasswordWithToken,
  findUserById,
};
