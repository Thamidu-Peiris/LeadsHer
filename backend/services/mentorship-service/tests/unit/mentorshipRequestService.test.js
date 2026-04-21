/**
 * Unit Tests — mentorshipRequestService
 * Validates business logic in isolation using in-memory MongoDB.
 */
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const { connect, disconnect, clearCollections } = require('../helpers/db');
const { createUser, createMentor, disableEmailVerification } = require('../helpers/factories');
const mentorshipRequestService = require('../../src/services/mentorshipRequestService');

beforeAll(async () => { await connect(); });
afterAll(async () => { await disconnect(); });
beforeEach(async () => {
  await clearCollections();
  await disableEmailVerification();
});

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
};

// ── createRequest ─────────────────────────────────────────────────────────────
describe('createRequest', () => {
  it('creates a pending mentorship request successfully', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const { user: mentor } = await createMentor();

    const req = await mentorshipRequestService.createRequest(mentee._id, {
      mentorId: mentor._id,
      goals: ['Learn React'],
      preferredStartDate: futureDate(),
      message: 'Looking forward to learning from you.',
    });

    expect(req.status).toBe('pending');
    // After createRequest, mentor/mentee are populated objects
    const mentorId = req.mentor._id ? req.mentor._id.toString() : req.mentor.toString();
    const menteeId = req.mentee._id ? req.mentee._id.toString() : req.mentee.toString();
    expect(mentorId).toBe(mentor._id.toString());
    expect(menteeId).toBe(mentee._id.toString());
  });

  it('throws 404 when mentor profile does not exist', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const fakeId = new (require('mongoose').Types.ObjectId)();

    await expect(
      mentorshipRequestService.createRequest(mentee._id, {
        mentorId: fakeId,
        goals: ['Learn something'],
        preferredStartDate: futureDate(),
        message: 'Hi',
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws 400 when mentor is not verified', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const MentorProfile = require('../../src/models/MentorProfile');
    const { user: mentor } = await createUser({ role: 'mentor' });
    await MentorProfile.create({
      user: mentor._id,
      expertise: ['Java'],
      yearsOfExperience: 2,
      industries: ['Finance'],
      mentoringAreas: ['Leadership'],
      availability: { maxMentees: 2, currentMentees: 0, timezone: 'UTC' },
      bio: 'Test bio.',
      isVerified: false,
      isAvailable: true,
    });

    await expect(
      mentorshipRequestService.createRequest(mentee._id, {
        mentorId: mentor._id,
        goals: ['Learn'],
        preferredStartDate: futureDate(),
        message: 'Hi',
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws 400 when preferred start date is in the past', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const { user: mentor } = await createMentor();

    const pastDate = new Date(Date.now() - 86400000).toISOString();

    await expect(
      mentorshipRequestService.createRequest(mentee._id, {
        mentorId: mentor._id,
        goals: ['Learn'],
        preferredStartDate: pastDate,
        message: 'Hi',
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws 400 when duplicate pending request exists', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const { user: mentor } = await createMentor();
    const payload = {
      mentorId: mentor._id,
      goals: ['Goal'],
      preferredStartDate: futureDate(),
      message: 'Hi',
    };

    await mentorshipRequestService.createRequest(mentee._id, payload);

    await expect(
      mentorshipRequestService.createRequest(mentee._id, payload)
    ).rejects.toMatchObject({ status: 400 });
  });

  it('throws 403 when caller is not a mentee', async () => {
    const { user: mentor } = await createMentor({ email: 'mentor403@t.com' });
    const { user: mentor2 } = await createMentor({ email: 'mentor2@t.com' });

    await expect(
      mentorshipRequestService.createRequest(mentor._id, {
        mentorId: mentor2._id,
        goals: ['Goal'],
        preferredStartDate: futureDate(),
        message: 'Hi',
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('accepts MentorProfile _id as mentorId and stores mentor user id', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const { user: mentor, profile } = await createMentor();

    const req = await mentorshipRequestService.createRequest(mentee._id, {
      mentorId: profile._id,
      goals: ['Learn'],
      preferredStartDate: futureDate(),
      message: 'Hi',
    });

    const mentorRef = req.mentor._id ? req.mentor._id.toString() : req.mentor.toString();
    expect(mentorRef).toBe(mentor._id.toString());
  });
});

// ── getRequests ───────────────────────────────────────────────────────────────
describe('getRequests', () => {
  it('returns sent requests for a mentee', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const { user: mentor } = await createMentor();

    await mentorshipRequestService.createRequest(mentee._id, {
      mentorId: mentor._id,
      goals: ['Improve'],
      preferredStartDate: futureDate(),
      message: 'Hello',
    });

    const { data } = await mentorshipRequestService.getRequests(mentee._id, 'mentee', { type: 'sent' });
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].mentee._id.toString()).toBe(mentee._id.toString());
  });

  it('returns received requests for a mentor', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const { user: mentor } = await createMentor();

    await mentorshipRequestService.createRequest(mentee._id, {
      mentorId: mentor._id,
      goals: ['Goal'],
      preferredStartDate: futureDate(),
      message: 'Hi',
    });

    const { data } = await mentorshipRequestService.getRequests(mentor._id, 'mentor', { type: 'received' });
    expect(data.length).toBeGreaterThan(0);
  });
});

// ── acceptRequest / rejectRequest ─────────────────────────────────────────────
describe('acceptRequest / rejectRequest', () => {
  it('accepts a pending request and creates an active mentorship', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const { user: mentor } = await createMentor();

    const req = await mentorshipRequestService.createRequest(mentee._id, {
      mentorId: mentor._id,
      goals: ['Learn'],
      preferredStartDate: futureDate(),
      message: 'Hi',
    });

    const { request, mentorship } = await mentorshipRequestService.acceptRequest(
      req._id, mentor._id, 'Welcome aboard!'
    );
    expect(request.status).toBe('accepted');
    expect(mentorship.status).toBe('active');
  });

  it('rejects a pending request', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const { user: mentor } = await createMentor();

    const req = await mentorshipRequestService.createRequest(mentee._id, {
      mentorId: mentor._id,
      goals: ['Learn'],
      preferredStartDate: futureDate(),
      message: 'Hi',
    });

    const rejected = await mentorshipRequestService.rejectRequest(
      req._id, mentor._id, 'Not available right now.'
    );
    expect(rejected.status).toBe('rejected');
  });

  it('throws 403 when non-mentor tries to accept', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const { user: mentee2 } = await createUser({ email: 'mentee2@test.com', role: 'mentee' });
    const { user: mentor } = await createMentor();

    const req = await mentorshipRequestService.createRequest(mentee._id, {
      mentorId: mentor._id,
      goals: ['Learn'],
      preferredStartDate: futureDate(),
      message: 'Hi',
    });

    await expect(
      mentorshipRequestService.acceptRequest(req._id, mentee2._id)
    ).rejects.toMatchObject({ status: 403 });
  });
});

// ── cancelRequest ─────────────────────────────────────────────────────────────
describe('cancelRequest', () => {
  it('allows mentee to cancel a pending request', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const { user: mentor } = await createMentor();

    const req = await mentorshipRequestService.createRequest(mentee._id, {
      mentorId: mentor._id,
      goals: ['Goal'],
      preferredStartDate: futureDate(),
      message: 'Hi',
    });

    const cancelled = await mentorshipRequestService.cancelRequest(req._id, mentee._id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('throws 403 when mentor tries to cancel', async () => {
    const { user: mentee } = await createUser({ role: 'mentee' });
    const { user: mentor } = await createMentor();

    const req = await mentorshipRequestService.createRequest(mentee._id, {
      mentorId: mentor._id,
      goals: ['Goal'],
      preferredStartDate: futureDate(),
      message: 'Hi',
    });

    await expect(
      mentorshipRequestService.cancelRequest(req._id, mentor._id)
    ).rejects.toMatchObject({ status: 403 });
  });
});
