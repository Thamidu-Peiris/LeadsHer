/**
 * Test factories — create seeded documents for use in tests.
 */
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const MentorProfile = require('../../src/models/MentorProfile');
const AppSettings = require('../../src/models/AppSettings');

const makeToken = (user) =>
  jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

const disableEmailVerification = () =>
  AppSettings.findOneAndUpdate(
    { _id: 'singleton' },
    { emailVerificationRequired: false },
    { upsert: true, setDefaultsOnInsert: true }
  );

const createUser = async (overrides = {}) => {
  const user = await User.create({
    name: overrides.name || 'Test User',
    email: overrides.email || `user_${Date.now()}@example.com`,
    password: overrides.password || 'Password1!',
    role: overrides.role || 'mentee',
    isEmailVerified: true,
    ...overrides,
  });
  return { user, token: makeToken(user) };
};

const createMentor = async (overrides = {}) => {
  const { user, token } = await createUser({
    name: 'Mentor User',
    role: 'mentor',
    ...overrides,
  });
  const profile = await MentorProfile.create({
    user: user._id,
    expertise: ['JavaScript', 'React'],
    yearsOfExperience: 5,
    industries: ['Tech'],
    mentoringAreas: ['Career Growth'],
    availability: {
      maxMentees: 3,
      currentMentees: 0,
      timezone: 'UTC',
    },
    bio: 'Experienced software engineer passionate about mentoring.',
    isVerified: true,
    isAvailable: true,
  });
  return { user, profile, token };
};

module.exports = { createUser, createMentor, disableEmailVerification };
