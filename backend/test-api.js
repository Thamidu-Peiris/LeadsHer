/**
 * Quick test script for auth API.
 * Run: node test-api.js
 * Make sure the server is running first: node index.js
 */

const BASE = 'http://localhost:5000/api';

async function test() {
  const email = `test${Date.now()}@example.com`;
  const password = '123456';

  console.log('1. Register...');
  const reg = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email, password }),
  });
  const regData = await reg.json();
  if (!reg.ok) {
    console.log('Register failed:', regData);
    return;
  }
  console.log('   OK:', regData.message, '| user:', regData.user.email);

  console.log('2. Login...');
  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginData = await login.json();
  if (!login.ok) {
    console.log('Login failed:', loginData);
    return;
  }
  const token = loginData.token;
  console.log('   OK:', loginData.message, '| token received');

  console.log('3. Get profile (with token)...');
  const profile = await fetch(`${BASE}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const profileData = await profile.json();
  if (!profile.ok) {
    console.log('Profile failed:', profileData);
    return;
  }
  console.log('   OK:', profileData);

  console.log('\nAll tests passed.');
}

test().catch((err) => console.error('Error:', err.message));
