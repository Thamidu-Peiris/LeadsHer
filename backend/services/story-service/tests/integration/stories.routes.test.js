/**
 * Integration Tests — Story Service API (/api/stories)
 */
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');

let mongod;

const makeToken = (id, role = 'mentee') =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const createUser = async (overrides = {}) => {
  const User = require('../../src/models/User');
  const user = await User.create({
    name: overrides.name || 'Story Author',
    email: overrides.email || `author_${Date.now()}@test.com`,
    password: 'Password1!',
    role: overrides.role || 'mentee',
    isEmailVerified: true,
  });
  return { user, token: makeToken(user._id.toString(), user.role) };
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
    expect(res.body.service).toBe('story-service');
  });
});

// ── GET /api/stories ───────────────────────────────────────────────────────────
describe('GET /api/stories', () => {
  it('200 — returns empty list when no stories exist', async () => {
    const res = await request(app).get('/api/stories');
    expect(res.status).toBe(200);
    const items = res.body.data || res.body;
    expect(Array.isArray(items)).toBe(true);
  });

  it('200 — returns published stories', async () => {
    const { user } = await createUser();
    const Story = require('../../src/models/Story');
    await Story.create({
      author: user._id,
      title: 'Test Story',
      content: 'Full content here.',
      status: 'published',
      publishedAt: new Date(),
    });

    const res = await request(app).get('/api/stories');
    expect(res.status).toBe(200);
    const items = res.body.data || res.body;
    expect(items.length).toBeGreaterThan(0);
  });

  it('supports category filter', async () => {
    const res = await request(app).get('/api/stories?category=STEM');
    expect(res.status).toBe(200);
  });
});

// ── POST /api/stories ──────────────────────────────────────────────────────────
describe('POST /api/stories', () => {
  it('201 — authenticated user creates a story', async () => {
    const { token } = await createUser({ email: 'creator@test.com' });

    const res = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'My Journey in Tech',
        content: 'This is the full story content about my journey.',
        category: 'STEM',
        status: 'published',
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('My Journey in Tech');
  });

  it('401 — unauthenticated request is rejected', async () => {
    const res = await request(app).post('/api/stories').send({
      title: 'Unauthorized story',
      content: 'Should not be created.',
    });
    expect(res.status).toBe(401);
  });

  it('400 — missing required title or content', async () => {
    const { token } = await createUser({ email: 'badstory@test.com' });
    const res = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'STEM' });
    expect(res.status).toBe(400);
  });
});

// ── GET /api/stories/:id ───────────────────────────────────────────────────────
describe('GET /api/stories/:id', () => {
  it('200 — returns a single story', async () => {
    const { user, token } = await createUser({ email: 'single@test.com' });
    const createRes = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Single Story', content: 'Some content here.', status: 'published' });

    const res = await request(app).get(`/api/stories/${createRes.body._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Single Story');
  });

  it('404 — unknown story ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/stories/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// ── PUT /api/stories/:id ───────────────────────────────────────────────────────
describe('PUT /api/stories/:id', () => {
  it('200 — author can update their story', async () => {
    const { token } = await createUser({ email: 'updater@test.com' });
    const createRes = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Original Title', content: 'Content.', status: 'draft' });

    const updateRes = await request(app)
      .put(`/api/stories/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toBe('Updated Title');
  });

  it('403 — another user cannot update someone else\'s story', async () => {
    const { token: ownerToken } = await createUser({ email: 'owner@test.com' });
    const { token: otherToken } = await createUser({ email: 'other@test.com' });

    const createRes = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Owner Story', content: 'Content.', status: 'draft' });

    const updateRes = await request(app)
      .put(`/api/stories/${createRes.body._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hijacked Title' });

    expect(updateRes.status).toBe(403);
  });
});

// ── DELETE /api/stories/:id ───────────────────────────────────────────────────
describe('DELETE /api/stories/:id', () => {
  it('200 — author can delete their own story', async () => {
    const { token } = await createUser({ email: 'deleter@test.com' });
    const createRes = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Delete', content: 'Delete me.', status: 'draft' });

    const deleteRes = await request(app)
      .delete(`/api/stories/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
  });
});

// ── POST /api/stories/:id/like ─────────────────────────────────────────────────
describe('POST /api/stories/:id/like', () => {
  it('200 — authenticated user can like/unlike a story', async () => {
    const { token: authorToken } = await createUser({ email: 'author@test.com' });
    const { token: likerToken } = await createUser({ email: 'liker@test.com' });

    const createRes = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ title: 'Likable Story', content: 'Content.', status: 'published' });

    const likeRes = await request(app)
      .post(`/api/stories/${createRes.body._id}/like`)
      .set('Authorization', `Bearer ${likerToken}`);

    expect(likeRes.status).toBe(200);
  });
});

// ── Comments ───────────────────────────────────────────────────────────────────
describe('Story comments', () => {
  let storyId, authToken;

  beforeEach(async () => {
    const { token } = await createUser({ email: `commenter_${Date.now()}@test.com` });
    authToken = token;
    const createRes = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Comment Test Story', content: 'Content.', status: 'published' });
    storyId = createRes.body._id;
  });

  it('201 — adds a comment to a story', async () => {
    const res = await request(app)
      .post(`/api/stories/${storyId}/comments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Great story!' });

    expect(res.status).toBe(201);
  });

  it('200 — lists comments for a story', async () => {
    const res = await request(app).get(`/api/stories/${storyId}/comments`);
    expect(res.status).toBe(200);
  });
});
