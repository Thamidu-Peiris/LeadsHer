/**
 * Integration Tests — Forum Service API (/api/forum)
 */
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');

let mongod;

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

const createUser = async (overrides = {}) => {
  const User = require('../../src/models/User');
  const AppSettings = require('../../src/models/AppSettings');
  await AppSettings.findOneAndUpdate(
    { _id: 'singleton' },
    { emailVerificationRequired: false },
    { upsert: true, setDefaultsOnInsert: true }
  );
  const user = await User.create({
    name: overrides.name || 'Forum User',
    email: overrides.email || `forum_${Date.now()}@test.com`,
    password: 'Password1!',
    role: overrides.role || 'mentee',
    isEmailVerified: true,
  });
  return { user, token: makeToken(user._id.toString()) };
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
    expect(res.body.service).toBe('forum-service');
  });
});

// ── GET /api/forum/topics ──────────────────────────────────────────────────────
describe('GET /api/forum/topics', () => {
  it('200 — returns topic list (public)', async () => {
    const res = await request(app).get('/api/forum/topics');
    expect(res.status).toBe(200);
    const items = res.body.topics || res.body.data || res.body;
    expect(Array.isArray(items)).toBe(true);
  });

  it('supports category filter query', async () => {
    const res = await request(app).get('/api/forum/topics?category=general');
    expect(res.status).toBe(200);
  });

  it('supports pagination', async () => {
    const res = await request(app).get('/api/forum/topics?page=1&limit=10');
    expect(res.status).toBe(200);
  });
});

// ── POST /api/forum/topics ─────────────────────────────────────────────────────
describe('POST /api/forum/topics', () => {
  it('201 — authenticated user creates a topic', async () => {
    const { token } = await createUser({ email: 'topicauthor@test.com' });

    const res = await request(app)
      .post('/api/forum/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'How to break into tech?',
        content: 'Looking for advice on transitioning into tech.',
        category: 'career-advice',
        tags: ['career', 'tech'],
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('How to break into tech?');
  });

  it('401 — unauthenticated cannot create topic', async () => {
    const res = await request(app).post('/api/forum/topics').send({
      title: 'Anon post',
      content: 'Should be rejected.',
    });
    expect(res.status).toBe(401);
  });

  it('400 — missing required fields', async () => {
    const { token } = await createUser({ email: 'missing@test.com' });
    const res = await request(app)
      .post('/api/forum/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'general' });
    expect(res.status).toBe(400);
  });
});

// ── GET /api/forum/topics/:id ──────────────────────────────────────────────────
describe('GET /api/forum/topics/:id', () => {
  it('200 — returns a single topic', async () => {
    const { token } = await createUser({ email: 'view@test.com' });
    const createRes = await request(app)
      .post('/api/forum/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Viewable Topic', content: 'Topic content here.', category: 'general' });

    const res = await request(app).get(`/api/forum/topics/${createRes.body._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Viewable Topic');
  });

  it('404 — unknown topic ID', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/forum/topics/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// ── PUT /api/forum/topics/:id ──────────────────────────────────────────────────
describe('PUT /api/forum/topics/:id', () => {
  it('200 — author updates their own topic', async () => {
    const { token } = await createUser({ email: 'topicedit@test.com' });
    const createRes = await request(app)
      .post('/api/forum/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Original', content: 'Content.', category: 'general' });

    const updateRes = await request(app)
      .put(`/api/forum/topics/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated', content: 'Updated content.' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.title).toBe('Updated');
  });
});

// ── DELETE /api/forum/topics/:id ──────────────────────────────────────────────
describe('DELETE /api/forum/topics/:id', () => {
  it('200 — author deletes their own topic', async () => {
    const { token } = await createUser({ email: 'topicdelete@test.com' });
    const createRes = await request(app)
      .post('/api/forum/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Delete me', content: 'Bye.', category: 'general' });

    const deleteRes = await request(app)
      .delete(`/api/forum/topics/${createRes.body._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
  });
});

// ── Replies ────────────────────────────────────────────────────────────────────
describe('Forum replies', () => {
  let topicId, replyToken;

  beforeEach(async () => {
    const { token } = await createUser({ email: `replyuser_${Date.now()}@test.com` });
    replyToken = token;
    const res = await request(app)
      .post('/api/forum/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Reply Test Topic', content: 'A topic to reply to.', category: 'general' });
    topicId = res.body._id;
  });

  it('201 — posts a reply to a topic', async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/replies`)
      .set('Authorization', `Bearer ${replyToken}`)
      .send({ content: 'This is a helpful reply.' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('This is a helpful reply.');
  });

  it('401 — unauthenticated cannot reply', async () => {
    const res = await request(app)
      .post(`/api/forum/topics/${topicId}/replies`)
      .send({ content: 'Anonymous reply.' });
    expect(res.status).toBe(401);
  });
});

// ── Voting ─────────────────────────────────────────────────────────────────────
describe('Voting on posts', () => {
  it('200 — user can upvote a topic', async () => {
    const { token: authorToken } = await createUser({ email: 'voteauthor@test.com' });
    const { token: voterToken } = await createUser({ email: 'voter@test.com' });

    const createRes = await request(app)
      .post('/api/forum/topics')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({ title: 'Votable Topic', content: 'Vote on this.', category: 'general' });

    const voteRes = await request(app)
      .post(`/api/forum/posts/${createRes.body._id}/vote`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ type: 'upvote' });

    expect(voteRes.status).toBe(200);
  });
});
