const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 8, select: false },
    role: {
      type: String,
      enum: ['admin', 'mentor', 'mentee', 'guest'],
      default: 'mentee',
    },
    bio: { type: String, default: '', maxlength: 500 },
    profilePicture: { type: String, default: '' },
    expertise: [{ type: String, trim: true }],
    industry: { type: String, default: '' },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid', 'senior', 'executive'],
      default: 'entry',
    },
    linkedin: { type: String, default: '' },
    location: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    googleId: { type: String, sparse: true, select: false },
    linkedinId: { type: String, sparse: true, select: false },
    privacy: {
      profileVisible: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.computeProfileCompletion = function () {
  const fields = [
    this.name,
    this.email,
    this.bio,
    this.profilePicture,
    this.industry,
    this.experienceLevel,
    Array.isArray(this.expertise) && this.expertise.length > 0,
  ];
  if (this.role === 'mentor') {
    fields.push(this.linkedin);
  }
  const filled = fields.filter(Boolean).length;
  const total = fields.length;
  return total ? Math.round((filled / total) * 100) : 0;
};

userSchema.pre('save', function () {
  if (this.isModified('name') || this.isModified('bio') || this.isModified('profilePicture') ||
      this.isModified('industry') || this.isModified('experienceLevel') || this.isModified('expertise') ||
      this.isModified('linkedin') || this.isModified('role')) {
    const pct = this.computeProfileCompletion();
    this.isProfileComplete = this.role === 'mentor' ? pct >= 80 : pct >= 50;
  }
});

module.exports = mongoose.model('User', userSchema);
