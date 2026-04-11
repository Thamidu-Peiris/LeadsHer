/**
 * Integration Tests — Resource Service API (/api/resources)
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
    name: overrides.name || 'Resource User',
    email: overrides.email || `resuser_${Date.now()}@test.com`,
    password: 'Password1!',
    role: overrides.role || 'Mentor',
    isEmailVerified: true,
  });
  return { user, token: makeToken(user._id.toString()) };
};

const validResource = {
  title: 'Leadership 101',
  description: 'A guide to developing leadership skills in the workplace.',
  type: 'guide',
  category: 'leadership-skills',
  tags: ['leadership', 'career'],
  difficulty: 'beginner',
  externalLink: 'https://example.com/leadership',
};

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
    expect(res.body.service).toBe('resource-service');
  });
});

// ── GET /api/resources ─────────────────────────────────────────────────────────
describe('GET /api/resources', () => {
  it('200 — returns empty list when no resources', async () => {
    const res = await request(app).get('/api/resources');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.resources)).toBe(true);
    expect(res.body.resources).toEqual([]);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(0);
  });

  it('supports type filter', async () => {
    const res = await request(app).get('/api/resources?type=guide');
    expect(res.status).toBe(200);
  });

  it('supports category filter', async () => {
    const res = await request(app).get('/api/resources?category=leadership-skills');
    expect(res.status).toBe(200);
  });
});

// ── POST /api/resources ────────────────────────────────────────────────────────
describe('POST /api/resources', () => {
  it('201 — authenticated mentor creates a resource', async () => {
    const { token } = await createUser({ email: 'rccreate@test.com', role: 'Mentor' });

    const res = await request(app)
      .post('/api/resources')
      .set('Authorization', `Bearer ${token}`)
      .send(validResource);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Leadership 101');
  });

  it('401 — unauthenticated cannot create resources', async () => {
    const res = await request(app).post('/api/resources').send(validResource);
    expect(res.status).toBe(401);
  });

  it('400 — missing required fields', async () => {
    const { token } = await createUser({ email: 'rcbad@test.com' });
    const res = await request(app)
      .post('/api/resources')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Incomplete Resource' });
    expect(res.status).toBe(400);
  });
});

// ── GET /api/resources/:id ─────────────────────────────────────────────────────
describe('GET /api/resources/:id', () => {
  it('200 — returns a single approved resource', async () => {
    const { user, token } = await createUser({ email: 'rcsingle@test.com' });
    const Resource = require('../../src/models/Resource');
    const resource = await Resource.create({
      ...validResource,
      uploadedBy: user._id,
      isApproved: true,
    });

    const res = await request(app).get(`/api/resources/${resource._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Leadership 101');
  });

  it('404 — unknown resource ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/resources/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// ── PUT /api/resources/:id ─────────────────────────────────────────────────────
describe('PUT /api/resources/:id', () => {
  it('200 — uploader can update their resource', async () => {
    const { token } = await createUser({ email: 'rcupdate@test.com' });
    const createRes = await request(app)
      .post('/api/resources')
      .set('Authorization', `Bearer ${token}`)
      .send(validResource);

    const resourceId = createRes.body._id || createRes.body.id;
    const updateRes = await request(app)
      .put(`/api/resources/${resourceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Leadership Advanced' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toBe('Leadership Advanced');
  });

  it('403 — another user cannot update someone else\'s resource', async () => {
    const { token: ownerToken } = await createUser({ email: 'rcowner@test.com' });
    const { token: otherToken } = await createUser({ email: 'rcother@test.com' });

    const createRes = await request(app)
      .post('/api/resources')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validResource);

    const resourceId = createRes.body._id || createRes.body.id;
    const updateRes = await request(app)
      .put(`/api/resources/${resourceId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hijacked' });

    expect(updateRes.status).toBe(403);
  });
});

// ── DELETE /api/resources/:id ──────────────────────────────────────────────────
describe('DELETE /api/resources/:id', () => {
  it('200 — uploader can delete their own resource', async () => {
    const { token } = await createUser({ email: 'rcdelete@test.com' });
    const createRes = await request(app)
      .post('/api/resources')
      .set('Authorization', `Bearer ${token}`)
      .send(validResource);

    const resourceId = createRes.body._id || createRes.body.id;
    const deleteRes = await request(app)
      .delete(`/api/resources/${resourceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
  });
});

// ── Bookmarks ──────────────────────────────────────────────────────────────────
describe('POST /api/resources/:id/bookmark', () => {
  it('200 — user can toggle bookmark on a resource', async () => {
    const { user } = await createUser({ email: 'rcbookmarkowner@test.com' });
    const { token: viewerToken } = await createUser({ email: 'rcbookmark@test.com' });
    const Resource = require('../../src/models/Resource');
    const resource = await Resource.create({ ...validResource, uploadedBy: user._id, isApproved: true });

    const res = await request(app)
      .post(`/api/resources/${resource._id}/bookmark`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
  });
});
