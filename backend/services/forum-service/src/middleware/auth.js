const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppSettings = require('../models/AppSettings');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized. No token.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .select('+emailVerificationCodeHash');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    try {
      const settings = await AppSettings.getSingleton();
      const pending =
        settings.emailVerificationRequired !== false &&
        !user.isEmailVerified &&
        user.emailVerificationCodeHash;
      if (pending) {
        return res.status(403).json({
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Verify your email to continue.',
        });
      }
    } catch (e) {
      return next(e);
    }
    if (!user.isEmailVerified && !user.emailVerificationCodeHash) {
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized. Invalid or expired token.' });
  }
};

const role = (...allowed) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized.' });
  if (allowed.includes(req.user.role)) return next();
  return res.status(403).json({ message: 'Access denied for this role.' });
};

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpires');
    if (user) req.user = user;
  } catch (err) {}
  next();
};

module.exports = { protect, role, optionalAuth };
