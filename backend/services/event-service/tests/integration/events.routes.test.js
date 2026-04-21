/**
 * Integration Tests — Event Service API (/api/events)
 */
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');

let mongod;

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const createUser = async (overrides = {}) => {
  const User = require('../../src/models/User');
  const AppSettings = require('../../src/models/AppSettings');
  await AppSettings.findOneAndUpdate(
    { _id: 'singleton' },
    { emailVerificationRequired: false },
    { upsert: true, setDefaultsOnInsert: true }
  );
  const user = await User.create({
    name: overrides.name || 'Event User',
    email: overrides.email || `evtuser_${Date.now()}@test.com`,
    password: 'Password1!',
    role: overrides.role || 'mentor',
    isEmailVerified: true,
  });
  return { user, token: makeToken(user._id.toString()) };
};

const futureDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString();
};

const validEvent = () => ({
  title: 'Women in Tech Summit',
  description: 'A summit bringing together women leaders in technology to share insights and build networks.',
  category: 'conference',
  type: 'virtual',
  date: futureDate(),
  startTime: '09:00',
  endTime: '17:00',
  duration: 480,
  capacity: 100,
  location: { virtualLink: 'https://meet.example.com/summit' },
  tags: ['tech', 'women', 'leadership'],
});

/** Create/PATCH/GET responses wrap the event in `{ data: { event } }`. */
const eventIdFromCreate = (createRes) =>
  createRes.body?.data?.event?._id?.toString?.() ||
  createRes.body?.data?.event?._id ||
  createRes.body?._id;

const eventFromBody = (res) => res.body?.data?.event ?? res.body;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});
});

// ── Health ─────────────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('responds 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('event-service');
  });
});

// ── GET /api/events ────────────────────────────────────────────────────────────
describe('GET /api/events', () => {
  it('200 — returns empty list when no events', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data?.events)).toBe(true);
    expect(res.body.data.events).toEqual([]);
    expect(res.body.results).toBe(0);
  });

  it('supports status filter', async () => {
    const res = await request(app).get('/api/events?status=upcoming');
    expect(res.status).toBe(200);
  });

  it('supports category filter', async () => {
    const res = await request(app).get('/api/events?category=conference');
    expect(res.status).toBe(200);
  });
});

// ── POST /api/events ───────────────────────────────────────────────────────────
describe('POST /api/events', () => {
  it('201 — mentor creates an event', async () => {
    const { token } = await createUser({ email: 'evtcreate@test.com', role: 'mentor' });

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(validEvent());

    expect(res.status).toBe(201);
    expect(res.body.data?.event?.title).toBe('Women in Tech Summit');
  });

  it('401 — unauthenticated request is rejected', async () => {
    const res = await request(app).post('/api/events').send(validEvent());
    expect(res.status).toBe(401);
  });

  it('403 — mentee cannot create events', async () => {
    const { token } = await createUser({ email: 'evtmenteecreate@test.com', role: 'mentee' });

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(validEvent());

    expect(res.status).toBe(403);
  });

  it('400 — missing required fields returns error', async () => {
    const { token } = await createUser({ email: 'evtbad@test.com', role: 'mentor' });

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Incomplete Event' });

    expect(res.status).toBe(400);
  });
});

// ── GET /api/events/:id ────────────────────────────────────────────────────────
describe('GET /api/events/:id', () => {
  it('200 — returns event details', async () => {
    const { token } = await createUser({ email: 'evtdetail@test.com', role: 'mentor' });
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(validEvent());

    const eventId = eventIdFromCreate(createRes);
    expect(eventId).toBeDefined();
    const res = await request(app).get(`/api/events/${eventId}`);
    expect(res.status).toBe(200);
    expect(res.body.data?.event?.title).toBe('Women in Tech Summit');
  });

  it('404 — unknown event ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/events/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// ── PATCH /api/events/:id ──────────────────────────────────────────────────────
describe('PATCH /api/events/:id', () => {
  it('200 — creator can update their event', async () => {
    const { token } = await createUser({ email: 'evtupdate@test.com', role: 'mentor' });
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(validEvent());

    const eventId = eventIdFromCreate(createRes);
    const updateRes = await request(app)
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Summit Title' });

    expect(updateRes.status).toBe(200);
    expect(eventFromBody(updateRes).title).toBe('Updated Summit Title');
  });
});

// ── DELETE /api/events/:id ─────────────────────────────────────────────────────
describe('DELETE /api/events/:id', () => {
  it('204 — creator can delete their event', async () => {
    const { token } = await createUser({ email: 'evtdelete@test.com', role: 'mentor' });
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(validEvent());

    const eventId = eventIdFromCreate(createRes);
    const deleteRes = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(204);
  });
});

// ── Event Registration ─────────────────────────────────────────────────────────
describe('POST /api/events/:id/register', () => {
  it('201 — mentee can register for an event', async () => {
    const { token: mentorToken } = await createUser({ email: 'evthost@test.com', role: 'mentor' });
    const { token: menteeToken } = await createUser({ email: 'evtreg@test.com', role: 'mentee' });

    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send(validEvent());
    const eventId = eventIdFromCreate(createRes);
    expect(eventId).toBeDefined();

    const regRes = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${menteeToken}`);

    expect(regRes.status).toBe(201);
  });

  it('401 — unauthenticated cannot register', async () => {
    const { token } = await createUser({ email: 'evthostreg@test.com', role: 'mentor' });
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(validEvent());

    const eventId = eventIdFromCreate(createRes);
    const res = await request(app).post(`/api/events/${eventId}/register`);
    expect(res.status).toBe(401);
  });
});

// ── POST /api/events/:id/send-reminder-emails (admin) ──────────────────────────
describe('POST /api/events/:id/send-reminder-emails', () => {
  it('403 — mentor cannot trigger manual reminders', async () => {
    const { token: mentorToken } = await createUser({ email: 'evtrmmentor@test.com', role: 'mentor' });
    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send(validEvent());
    const eventId = eventIdFromCreate(createRes);

    const res = await request(app)
      .post(`/api/events/${eventId}/send-reminder-emails`)
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(res.status).toBe(403);
  });

  it('200 — admin can trigger manual reminders', async () => {
    const { token: mentorToken, user: mentor } = await createUser({
      email: 'evtrmhost@test.com',
      role: 'mentor',
    });
    const { token: adminToken } = await createUser({ email: 'evtrmadmin@test.com', role: 'admin' });
    const { token: menteeToken } = await createUser({ email: 'evtrmreg@test.com', role: 'mentee' });

    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ ...validEvent(), host: mentor._id });
    const eventId = eventIdFromCreate(createRes);

    await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${menteeToken}`);

    const res = await request(app)
      .post(`/api/events/${eventId}/send-reminder-emails`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('sent');
    expect(res.body.data).toHaveProperty('skipped');
    expect(res.body.data).toHaveProperty('eligible');
  });

  it('400 — cancelled event', async () => {
    const { token: mentorToken, user: mentor } = await createUser({
      email: 'evtrmcancel@test.com',
      role: 'mentor',
    });
    const { token: adminToken } = await createUser({ email: 'evtrmadmin2@test.com', role: 'admin' });

    const createRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({ ...validEvent(), host: mentor._id });
    const eventId = eventIdFromCreate(createRes);

    await request(app)
      .patch(`/api/events/${eventId}/cancel`)
      .set('Authorization', `Bearer ${mentorToken}`);

    const res = await request(app)
      .post(`/api/events/${eventId}/send-reminder-emails`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});
