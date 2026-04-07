/**
 * Unit Tests — authService
 * Tests pure logic functions in isolation with an in-memory MongoDB.
 */
process.env.JWT_SECRET = 'test-jwt-secret-unit';
process.env.NODE_ENV = 'test';

const { connect, disconnect, clearCollections } = require('../helpers/db');
const authService = require('../../src/services/authService');
const AppSettings = require('../../src/models/AppSettings');

// Disable email verification globally for all tests so we get direct tokens back
const disableVerification = () =>
  AppSettings.findOneAndUpdate(
    { _id: 'singleton' },
    { emailVerificationRequired: false },
    { upsert: true, setDefaultsOnInsert: true }
  );

beforeAll(async () => { await connect(); });
afterAll(async () => { await disconnect(); });
beforeEach(async () => {
  await clearCollections();
  await disableVerification();
});

// ── normalizeRole ────────────────────────────────────────────────────────────
describe('normalizeRole (via registerUser)', () => {
  it('defaults to "mentee" when role is omitted', async () => {
    const result = await authService.registerUser({
      name: 'Test User',
      email: 'norole@example.com',
      password: 'Password1!',
    });
    expect(result.user.role).toBe('mentee');
  });

  it('normalises unknown role values to "mentee"', async () => {
    const result = await authService.registerUser({
      name: 'Bad Role',
      email: 'badrole@example.com',
      password: 'Password1!',
      role: 'superuser',
    });
    expect(result.user.role).toBe('mentee');
  });

  it('accepts valid roles like "mentor"', async () => {
    const result = await authService.registerUser({
      name: 'Mentor User',
      email: 'mentor@example.com',
      password: 'Password1!',
      role: 'mentor',
    });
    expect(result.user.role).toBe('mentor');
  });
});

// ── toUserResponse ───────────────────────────────────────────────────────────
describe('toUserResponse', () => {
  it('includes expected public fields', async () => {
    const { user } = await authService.registerUser({
      name: 'Field Check',
      email: 'fields@example.com',
      password: 'Password1!',
    });
    const expected = ['id', 'name', 'email', 'role', 'bio', 'profilePicture',
      'isEmailVerified', 'isProfileComplete', 'createdAt', 'updatedAt'];
    expected.forEach((f) => expect(user).toHaveProperty(f));
  });

  it('never exposes password field', async () => {
    const { user } = await authService.registerUser({
      name: 'No Password',
      email: 'nopass@example.com',
      password: 'Password1!',
    });
    expect(user).not.toHaveProperty('password');
  });
});

// ── registerUser ─────────────────────────────────────────────────────────────
describe('registerUser', () => {
  it('creates a user and returns a JWT token', async () => {
    const result = await authService.registerUser({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password1!',
      role: 'mentee',
    });
    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe('alice@example.com');
    expect(result.user.name).toBe('Alice');
    expect(result.requiresVerification).toBe(false);
  });

  it('throws 400 when email is already registered', async () => {
    const payload = { name: 'Bob', email: 'bob@example.com', password: 'Password1!' };
    await authService.registerUser(payload);
    await expect(authService.registerUser(payload)).rejects.toMatchObject({ status: 400 });
  });

  it('sets isEmailVerified=true when verification is disabled', async () => {
    const { user } = await authService.registerUser({
      name: 'Verified',
      email: 'verified@example.com',
      password: 'Password1!',
    });
    expect(user.isEmailVerified).toBe(true);
  });
});

// ── loginUser ────────────────────────────────────────────────────────────────
describe('loginUser', () => {
  beforeEach(async () => {
    await authService.registerUser({
      name: 'Carol',
      email: 'carol@example.com',
      password: 'Password1!',
    });
  });

  it('returns token on valid credentials', async () => {
    const result = await authService.loginUser({ email: 'carol@example.com', password: 'Password1!' });
    expect(result).toHaveProperty('token');
    expect(result.user.email).toBe('carol@example.com');
  });

  it('throws 401 on wrong password', async () => {
    await expect(
      authService.loginUser({ email: 'carol@example.com', password: 'WrongPass!' })
    ).rejects.toMatchObject({ status: 401 });
  });

  it('throws 401 on non-existent email', async () => {
    await expect(
      authService.loginUser({ email: 'nobody@example.com', password: 'Password1!' })
    ).rejects.toMatchObject({ status: 401 });
  });
});

// ── getProfileById ───────────────────────────────────────────────────────────
describe('getProfileById', () => {
  it('returns user with profileCompletionPercent', async () => {
    const { user } = await authService.registerUser({
      name: 'Dave',
      email: 'dave@example.com',
      password: 'Password1!',
    });
    const profile = await authService.getProfileById(user.id);
    expect(profile).toHaveProperty('profileCompletionPercent');
    expect(typeof profile.profileCompletionPercent).toBe('number');
  });

  it('throws 404 for unknown user id', async () => {
    const { Types } = require('mongoose');
    await expect(
      authService.getProfileById(new Types.ObjectId().toString())
    ).rejects.toMatchObject({ status: 404 });
  });
});

// ── signToken ────────────────────────────────────────────────────────────────
describe('signToken', () => {
  it('returns a valid JWT string', () => {
    const jwt = require('jsonwebtoken');
    const token = authService.signToken('test-id-123');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe('test-id-123');
  });
});

// ── updateProfileById ─────────────────────────────────────────────────────────
describe('updateProfileById', () => {
  it('updates allowed fields and returns updated user', async () => {
    const { user } = await authService.registerUser({
      name: 'Frank',
      email: 'frank@example.com',
      password: 'Password1!',
    });
    const updated = await authService.updateProfileById(user.id, {
      bio: 'Software engineer.',
      location: 'New York',
    });
    expect(updated.bio).toBe('Software engineer.');
    expect(updated.location).toBe('New York');
  });

  it('ignores disallowed fields', async () => {
    const { user } = await authService.registerUser({
      name: 'Grace',
      email: 'grace@example.com',
      password: 'Password1!',
    });
    const updated = await authService.updateProfileById(user.id, {
      isSuspended: true,
    });
    expect(updated.isSuspended).toBe(false);
  });
});

// ── adminSetSuspension ───────────────────────────────────────────────────────
describe('adminSetSuspension', () => {
  it('suspends and un-suspends a user', async () => {
    const { user } = await authService.registerUser({
      name: 'Eve',
      email: 'eve@example.com',
      password: 'Password1!',
    });

    const suspended = await authService.adminSetSuspension(user.id, true, 'Violation');
    expect(suspended.isSuspended).toBe(true);
    expect(suspended.suspendedReason).toBe('Violation');

    const restored = await authService.adminSetSuspension(user.id, false);
    expect(restored.isSuspended).toBe(false);
    expect(restored.suspendedReason).toBe('');
  });
});

// ── adminSetUserRole ──────────────────────────────────────────────────────────
describe('adminSetUserRole', () => {
  it('changes user role to mentor', async () => {
    const { user } = await authService.registerUser({
      name: 'Hank',
      email: 'hank@example.com',
      password: 'Password1!',
      role: 'mentee',
    });
    const updated = await authService.adminSetUserRole(user.id, 'mentor');
    expect(updated.role).toBe('mentor');
  });

  it('throws 404 for unknown user id', async () => {
    const { Types } = require('mongoose');
    await expect(
      authService.adminSetUserRole(new Types.ObjectId().toString(), 'mentor')
    ).rejects.toMatchObject({ status: 404 });
  });
});

// ── listUsersForAdmin ─────────────────────────────────────────────────────────
describe('listUsersForAdmin', () => {
  beforeEach(async () => {
    await authService.registerUser({ name: 'User1', email: 'u1@example.com', password: 'Password1!', role: 'mentee' });
    await authService.registerUser({ name: 'User2', email: 'u2@example.com', password: 'Password1!', role: 'mentor' });
  });

  it('returns paginated user list', async () => {
    const result = await authService.listUsersForAdmin({ page: 1, limit: 10 });
    expect(result.data.length).toBeGreaterThanOrEqual(2);
    expect(result.pagination).toHaveProperty('total');
  });

  it('filters by role', async () => {
    const result = await authService.listUsersForAdmin({ role: 'mentor' });
    result.data.forEach((u) => expect(u.role).toBe('mentor'));
  });

  it('filters by search query', async () => {
    const result = await authService.listUsersForAdmin({ search: 'User1' });
    expect(result.data[0].name).toBe('User1');
  });
});
