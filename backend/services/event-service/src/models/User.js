const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 6, select: false },
        role: {
            type: String,
            enum: ['admin', 'mentor', 'mentee', 'guest'],
            default: 'mentee',
        },
        avatar: { type: String, default: '' },
        bio: { type: String, default: '' },
        profilePicture: { type: String, default: '' }, // Auth service uses profilePicture
        resetPasswordToken: { type: String, select: false },
        resetPasswordExpires: { type: Date, select: false },
        isEmailVerified: { type: Boolean, default: false },
        emailVerificationCodeHash: { type: String, select: false },
    },
    { timestamps: true }
);

// We don't need pre-save hooks for hashing password here as this service won't manage users.
// But we need the model to query the existing users collection.

module.exports = mongoose.model('User', userSchema);
