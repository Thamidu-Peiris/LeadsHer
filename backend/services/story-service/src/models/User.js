const mongoose = require('mongoose');

/**
 * Story-service only reads user data for authorization and story display.
 * The canonical user write-model lives in auth-service.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    role: { type: String, default: 'mentee' },
    bio: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    avatar: { type: String, default: '' }, // backward compat
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCodeHash: { type: String, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
