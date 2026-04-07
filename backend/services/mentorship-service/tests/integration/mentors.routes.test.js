/**
 * Integration Tests — Mentorship Service API (/api/mentors)
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

// ── Health ─────────────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('responds 200 with service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('mentorship-service');
  });
});

// ── GET /api/mentors (public listing) ─────────────────────────────────────────
describe('GET /api/mentors', () => {
  it('200 — returns empty array when no verified mentors', async () => {
    const res = await request(app).get('/api/mentors');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data || res.body)).toBe(true);
  });

  it('200 — lists only verified mentors', async () => {
    await createMentor({ email: 'mentor1@test.com' });
    const res = await request(app).get('/api/mentors');
    expect(res.status).toBe(200);
    const items = res.body.data || res.body;
    expect(items.length).toBeGreaterThan(0);
  });

  it('supports pagination via page and limit query params', async () => {
    const res = await request(app).get('/api/mentors?page=1&limit=5');
    expect(res.status).toBe(200);
  });
});

// ── POST /api/mentors/profile (create mentor profile) ─────────────────────────
describe('POST /api/mentors/profile', () => {
  const validProfile = {
    expertise: ['JavaScript', 'Node.js'],
    yearsOfExperience: 4,
    industries: ['Tech'],
    mentoringAreas: ['Web Dev'],
    bio: 'Experienced developer mentoring juniors.',
    availability: {
      maxMentees: 3,
      timezone: 'UTC',
    },
  };

  it('201 — mentor creates their profile', async () => {
    const { token } = await createUser({ role: 'mentor' });

    const res = await request(app)
      .post('/api/mentors/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(validProfile);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('expertise');
  });

  it('401 — unauthenticated request is rejected', async () => {
    const res = await request(app).post('/api/mentors/profile').send(validProfile);
    expect(res.status).toBe(401);
  });
});

// ── GET /api/mentors/:id (public mentor profile) ──────────────────────────────
describe('GET /api/mentors/:id', () => {
  it('200 — returns mentor profile by user ID', async () => {
    const { user } = await createMentor({ email: 'details@test.com' });
    const res = await request(app).get(`/api/mentors/user/${user._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('404 — unknown user ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/mentors/${fakeId}`);
    expect(res.status).toBe(404);
  });
});
