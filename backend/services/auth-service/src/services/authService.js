const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const toUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  bio: user.bio,
  profilePicture: user.profilePicture,
  expertise: user.expertise || [],
  industry: user.industry,
  experienceLevel: user.experienceLevel,
  linkedin: user.linkedin,
  location: user.location,
  isEmailVerified: user.isEmailVerified,
  isProfileComplete: user.isProfileComplete,
  isSuspended: user.isSuspended,
  suspendedAt: user.suspendedAt,
  suspendedReason: user.suspendedReason,
  privacy: user.privacy,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const normalizeRole = (r) => {
  if (!r) return 'mentee';
  const s = String(r).toLowerCase();
  return ['admin', 'mentor', 'mentee', 'guest'].includes(s) ? s : 'mentee';
};

const registerUser = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('User already exists with this email.');
    err.status = 400;
    throw err;
  }
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedVerification = crypto.createHash('sha256').update(verificationToken).digest('hex');
  const user = await User.create({
    name,
    email,
    password,
    role: normalizeRole(role),
    emailVerificationToken: hashedVerification,
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
  });
  await sendVerificationEmail(user.email, verificationToken);
  const token = signToken(user._id);
  return {
    token,
    user: toUserResponse(user),
    emailVerificationSent: true,
    ...(process.env.NODE_ENV !== 'production' && { verificationToken }),
  };
};

const verifyEmail = async (token) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: Date.now() },
  }).select('+emailVerificationToken +emailVerificationExpires');
  if (!user) {
    const err = new Error('Invalid or expired verification token.');
    err.status = 400;
    throw err;
  }
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  return { message: 'Email verified successfully.', user: toUserResponse(user) };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }
  if (user.isSuspended) {
    const err = new Error('Account is suspended. Contact admin.');
    err.status = 403;
    throw err;
  }
  const token = signToken(user._id);
  return { token, user: toUserResponse(user) };
};

const getProfileById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  const pct = user.computeProfileCompletion();
  return { ...toUserResponse(user), profileCompletionPercent: pct };
};

const updateProfileById = async (userId, updates, profilePictureUrl) => {
  const allowed = [
    'name', 'bio', 'profilePicture', 'expertise', 'industry', 'experienceLevel',
    'linkedin', 'location', 'role', 'privacy',
  ];
  const doc = {};
  allowed.forEach((k) => {
    if (updates[k] !== undefined) doc[k] = updates[k];
  });
  if (doc.role) doc.role = normalizeRole(doc.role);
  if (profilePictureUrl) doc.profilePicture = profilePictureUrl;
  const user = await User.findByIdAndUpdate(userId, doc, { new: true, runValidators: true });
  const pct = user.computeProfileCompletion();
  return { ...toUserResponse(user), profileCompletionPercent: pct };
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
  await sendPasswordResetEmail(user.email, resetToken);
  if (process.env.NODE_ENV !== 'production') {
    return {
      message: 'If an account exists, a reset link will be sent.',
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
  return { message: 'Password reset successfully.', token: jwtToken, user: toUserResponse(user) };
};

const findOrCreateGoogleUser = async ({ googleId, email, name, profilePicture }) => {
  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      if (profilePicture) user.profilePicture = profilePicture;
      await user.save({ validateBeforeSave: false });
    }
  } else {
    user = await User.create({
      name: name || email?.split('@')[0],
      email,
      password: crypto.randomBytes(24).toString('hex'),
      role: 'mentee',
      googleId,
      profilePicture: profilePicture || '',
      isEmailVerified: true,
    });
  }
  const token = signToken(user._id);
  return { token, user: toUserResponse(user) };
};

const findUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  return toUserResponse(user);
};

const listUsersForAdmin = async ({ role, search, page = 1, limit = 20 }) => {
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const rx = new RegExp(String(search).trim(), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const users = await User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit));
  const total = await User.countDocuments(filter);
  return {
    data: users.map(toUserResponse),
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  };
};

const adminUpdateUserProfile = async (userId, updates) => {
  const allowed = ['name', 'bio', 'industry', 'experienceLevel', 'linkedin', 'location', 'profilePicture'];
  const doc = {};
  allowed.forEach((k) => {
    if (updates[k] !== undefined) doc[k] = updates[k];
  });
  const user = await User.findByIdAndUpdate(userId, doc, { new: true, runValidators: true });
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  return toUserResponse(user);
};

const adminSetUserRole = async (userId, role) => {
  const normalizedRole = normalizeRole(role);
  const user = await User.findByIdAndUpdate(
    userId,
    { role: normalizedRole },
    { new: true, runValidators: true }
  );
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  return toUserResponse(user);
};

const adminSetSuspension = async (userId, suspended, reason) => {
  const patch = suspended
    ? { isSuspended: true, suspendedAt: new Date(), suspendedReason: reason || '' }
    : { isSuspended: false, suspendedAt: null, suspendedReason: '' };
  const user = await User.findByIdAndUpdate(userId, patch, { new: true, runValidators: true });
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  return toUserResponse(user);
};

module.exports = {
  signToken,
  registerUser,
  verifyEmail,
  loginUser,
  getProfileById,
  updateProfileById,
  forgotPasswordForEmail,
  resetPasswordWithToken,
  findOrCreateGoogleUser,
  findUserById,
  listUsersForAdmin,
  adminUpdateUserProfile,
  adminSetUserRole,
  adminSetSuspension,
  toUserResponse,
};
