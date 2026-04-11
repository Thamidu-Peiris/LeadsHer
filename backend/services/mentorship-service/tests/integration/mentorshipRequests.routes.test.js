/**
 * Integration Tests — Mentorship Requests API (/api/mentorship/requests)
 */
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const { createUser, createMentor, disableEmailVerification } = require('../helpers/factories');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});
  await disableEmailVerification();
});

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

// ── POST /api/mentorship/requests ─────────────────────────────────────────────
describe('POST /api/mentorship/requests', () => {
  it('201 — mentee sends a valid request', async () => {
    const { user: mentor } = await createMentor({ email: 'mentor@req.com' });
    const { token } = await createUser({ email: 'mentee@req.com', role: 'mentee' });

    const res = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mentorId: mentor._id.toString(),
        goals: ['Career growth'],
        preferredStartDate: futureDate(),
        message: 'I want to grow as a developer.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('status', 'pending');
  });

  it('400 — date in the past is rejected', async () => {
    const { user: mentor } = await createMentor({ email: 'mentor2@req.com' });
    const { token } = await createUser({ email: 'mentee2@req.com', role: 'mentee' });
    const pastDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mentorId: mentor._id.toString(),
        goals: ['Goal'],
        preferredStartDate: pastDate,
        message: 'Hi',
      });

    expect(res.status).toBe(400);
  });

  it('401 — unauthenticated request is rejected', async () => {
    const res = await request(app)
      .post('/api/mentorship/requests')
      .send({ mentorId: 'fake', goals: [], preferredStartDate: futureDate() });

    expect(res.status).toBe(401);
  });

  it('403 — mentor cannot create a mentorship request', async () => {
    const { token: mentorToken } = await createMentor({ email: 'mentorA403@req.com' });
    const { user: mentorB } = await createMentor({ email: 'mentorB403@req.com' });

    const res = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        mentorId: mentorB._id.toString(),
        goals: ['Career growth'],
        preferredStartDate: futureDate(),
        message: 'Invalid as mentor.',
      });

    expect(res.status).toBe(403);
  });
});

// ── GET /api/mentorship/requests ──────────────────────────────────────────────
describe('GET /api/mentorship/requests', () => {
  it('200 — mentee gets their sent requests', async () => {
    const { user: mentor } = await createMentor({ email: 'mget@req.com' });
    const { user: mentee, token } = await createUser({ email: 'menteeget@req.com', role: 'mentee' });

    await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        mentorId: mentor._id.toString(),
        goals: ['Skill up'],
        preferredStartDate: futureDate(),
        message: 'Ready to learn!',
      });

    const res = await request(app)
      .get('/api/mentorship/requests?type=sent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('401 — unauthenticated cannot list requests', async () => {
    const res = await request(app).get('/api/mentorship/requests');
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/mentorship/requests/:id/accept ─────────────────────────────────
describe('PATCH /api/mentorship/requests/:id/accept', () => {
  it('200 — mentor accepts a pending request', async () => {
    const { user: mentor, token: mentorToken } = await createMentor({ email: 'maccept@req.com' });
    const { token: menteeToken } = await createUser({ email: 'menteeaccept@req.com', role: 'mentee' });

    const createRes = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${menteeToken}`)
      .send({
        mentorId: mentor._id.toString(),
        goals: ['Learn React'],
        preferredStartDate: futureDate(),
        message: 'Hi mentor!',
      });

    const requestId = createRes.body.data._id;

    const acceptRes = await request(app)
      .put(`/api/mentorship/requests/${requestId}/accept`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ responseMessage: 'Happy to help!' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.request.status).toBe('accepted');
    expect(acceptRes.body.data.mentorship.status).toBe('active');
  });
});

// ── PATCH /api/mentorship/requests/:id/reject ─────────────────────────────────
describe('PATCH /api/mentorship/requests/:id/reject', () => {
  it('200 — mentor rejects a pending request', async () => {
    const { user: mentor, token: mentorToken } = await createMentor({ email: 'mreject@req.com' });
    const { token: menteeToken } = await createUser({ email: 'menteerej@req.com', role: 'mentee' });

    const createRes = await request(app)
      .post('/api/mentorship/requests')
      .set('Authorization', `Bearer ${menteeToken}`)
      .send({
        mentorId: mentor._id.toString(),
        goals: ['Learn'],
        preferredStartDate: futureDate(),
        message: 'Hi',
      });

    const rejectRes = await request(app)
      .put(`/api/mentorship/requests/${createRes.body.data._id}/reject`)
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ responseMessage: 'Not available currently.' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('rejected');
  });
});
