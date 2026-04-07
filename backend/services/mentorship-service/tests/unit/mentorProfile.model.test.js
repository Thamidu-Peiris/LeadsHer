/**
 * Unit Tests — MentorProfile model methods and virtuals
 */
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const { connect, disconnect, clearCollections } = require('../helpers/db');
const { createUser, createMentor } = require('../helpers/factories');
const MentorProfile = require('../../src/models/MentorProfile');

beforeAll(async () => { await connect(); });
afterAll(async () => { await disconnect(); });
afterEach(async () => { await clearCollections(); });

describe('MentorProfile.canAcceptMentees virtual', () => {
  it('returns true when available, verified, and has capacity', async () => {
    const { profile } = await createMentor();
    expect(profile.canAcceptMentees).toBe(true);
  });

  it('returns false when not verified', async () => {
    const { user } = await createUser({ role: 'mentor' });
    const profile = await MentorProfile.create({
      user: user._id,
      expertise: ['Python'],
      yearsOfExperience: 3,
      industries: ['Data'],
      mentoringAreas: ['ML'],
      availability: { maxMentees: 2, currentMentees: 0, timezone: 'UTC' },
      bio: 'Data scientist.',
      isVerified: false,
      isAvailable: true,
    });
    expect(profile.canAcceptMentees).toBe(false);
  });

  it('returns false when at max capacity', async () => {
    const { profile } = await createMentor();
    profile.availability.maxMentees = 2;
    profile.availability.currentMentees = 2;
    await profile.save();
    expect(profile.canAcceptMentees).toBe(false);
  });
});

describe('MentorProfile.updateRating method', () => {
  it('calculates correct rolling average', async () => {
    const { profile } = await createMentor();
    await profile.updateRating(4);
    expect(profile.rating).toBeCloseTo(4, 1);
    expect(profile.totalReviews).toBe(1);

    await profile.updateRating(2);
    expect(profile.rating).toBeCloseTo(3, 1);
    expect(profile.totalReviews).toBe(2);
  });
});

describe('MentorProfile.incrementMentees / decrementMentees', () => {
  it('correctly adjusts currentMentees and isAvailable', async () => {
    const { profile } = await createMentor();
    profile.availability.maxMentees = 2;
    await profile.save();

    await profile.incrementMentees();
    expect(profile.availability.currentMentees).toBe(1);
    expect(profile.isAvailable).toBe(true);

    await profile.incrementMentees();
    expect(profile.availability.currentMentees).toBe(2);
    expect(profile.isAvailable).toBe(false);

    await profile.decrementMentees();
    expect(profile.availability.currentMentees).toBe(1);
    expect(profile.isAvailable).toBe(true);
  });
});
