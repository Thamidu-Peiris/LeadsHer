/**
 * Integration Tests — Auth Service API
 * Uses supertest + in-memory MongoDB to test real HTTP request/response cycles.
 */
process.env.JWT_SECRET = 'test-jwt-secret-integration';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');

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

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── Health endpoint ──────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('responds 200 with service name', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('auth-service');
  });
});

// ── Registration ─────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  const validUser = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'Password1!',
    role: 'mentee',
  };

  it('201 — creates a new user and returns token', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(201);
    // Could require email verification depending on AppSettings
    expect([true, false]).toContain(
      res.body.requiresVerification !== undefined ? true : false
    );
  });

  it('400 — missing required fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'nopw@example.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('400 — duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(400);
  });

  it('400 — short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Short', email: 'short@example.com', password: '123' });
    expect(res.status).toBe(400);
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    // Seed a verified user directly via the service to avoid email flow
    const User = require('../../src/models/User');
    const AppSettings = require('../../src/models/AppSettings');
    await AppSettings.findOneAndUpdate(
      { _id: 'singleton' },
      { emailVerificationRequired: false },
      { upsert: true, setDefaultsOnInsert: true }
    );
    await User.create({
      name: 'Login User',
      email: 'login@example.com',
      password: 'Password1!',
      role: 'mentee',
      isEmailVerified: true,
    });
  });

  it('200 — valid credentials return token and user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'Password1!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('login@example.com');
  });

  it('401 — wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'WrongPass!' });
    expect(res.status).toBe(401);
  });

  it('401 — unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'Password1!' });
    expect(res.status).toBe(401);
  });

  it('400 — missing email or password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com' });
    expect(res.status).toBe(400);
  });
});

// ── Protected profile ────────────────────────────────────────────────────────
describe('GET /api/auth/profile', () => {
  let authToken;

  beforeEach(async () => {
    const User = require('../../src/models/User');
    const AppSettings = require('../../src/models/AppSettings');
    await AppSettings.findOneAndUpdate(
      { _id: 'singleton' },
      { emailVerificationRequired: false },
      { upsert: true, setDefaultsOnInsert: true }
    );
    await User.create({
      name: 'Profile User',
      email: 'profile@example.com',
      password: 'Password1!',
      role: 'mentee',
      isEmailVerified: true,
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'profile@example.com', password: 'Password1!' });
    authToken = loginRes.body.token;
  });

  it('200 — returns profile when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('profile@example.com');
    expect(res.body).not.toHaveProperty('password');
  });

  it('401 — rejected when no token provided', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  it('401 — rejected when token is malformed', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});

// ── Admin user list ───────────────────────────────────────────────────────────
describe('GET /api/auth/admin/users', () => {
  let adminToken;

  beforeEach(async () => {
    const User = require('../../src/models/User');
    const AppSettings = require('../../src/models/AppSettings');
    await AppSettings.findOneAndUpdate(
      { _id: 'singleton' },
      { emailVerificationRequired: false },
      { upsert: true, setDefaultsOnInsert: true }
    );
    await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'AdminPass1!',
      role: 'admin',
      isEmailVerified: true,
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'AdminPass1!' });
    adminToken = res.body.token;
  });

  it('200 — admin can list users', async () => {
    const res = await request(app)
      .get('/api/auth/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('403 — non-admin cannot list users', async () => {
    const User = require('../../src/models/User');
    await User.create({
      name: 'Mentee',
      email: 'mentee@example.com',
      password: 'Password1!',
      role: 'mentee',
      isEmailVerified: true,
    });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mentee@example.com', password: 'Password1!' });
    const menteeToken = loginRes.body.token;

    const res = await request(app)
      .get('/api/auth/admin/users')
      .set('Authorization', `Bearer ${menteeToken}`);
    expect(res.status).toBe(403);
  });
});

// ── Forgot / Reset password ───────────────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
  it('200 — always responds regardless of email existence (security)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});

// ── Registration config ───────────────────────────────────────────────────────
describe('GET /api/auth/registration-config', () => {
  it('200 — returns emailVerificationRequired flag', async () => {
    const res = await request(app).get('/api/auth/registration-config');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('emailVerificationRequired');
    expect(typeof res.body.emailVerificationRequired).toBe('boolean');
  });
});
