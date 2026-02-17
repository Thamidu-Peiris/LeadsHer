const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -googleId -linkedinId');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized. Invalid or expired token.' });
  }
};

/** Require email to be verified for full access. Use after protect. */
const requireEmailVerified = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized.' });
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      message: 'Email verification required. Check your inbox or use the verification link.',
    });
  }
  next();
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

module.exports = { protect, role, optionalAuth, requireEmailVerified };
