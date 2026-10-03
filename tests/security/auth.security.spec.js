/**
 * Member 1: Identity, Credential & Session Security
 * SECURITY REGRESSION TESTS
 *
 * Unlike the component specs, these call the real backend API, so they fail
 * if any of the fixed authentication vulnerabilities is reintroduced.
 * Requires the backend running on http://127.0.0.1:5000 with a test database.
 */

const { test, expect } = require('@playwright/test');

const PASSWORD = 'Secure12345';

// Fresh dummy account per test so tests never depend on each other
const uniqueEmail = (label) => `sec-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.com`;

async function registerUser(request, label) {
  const email = uniqueEmail(label);
  const res = await request.post('/api/auth/register', {
    data: { name: 'Security Test', email, password: PASSWORD },
  });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return { email, token: body.data.token };
}

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

test.describe('F1 - Password reset token is not exposed', () => {
  test('forgot-password response does not contain the reset token', async ({ request }) => {
    const { email } = await registerUser(request, 'f1');

    const res = await request.post('/api/auth/forgot-password', { data: { email } });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.data?.resetToken).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/[a-f0-9]{64}/); // no 32-byte hex token anywhere
  });

  test('a guessed reset token is rejected', async ({ request }) => {
    const res = await request.post(`/api/auth/reset-password/${'a'.repeat(64)}`, {
      data: { newPassword: 'Hacked12345' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('F2 - No account enumeration', () => {
  test('forgot-password responds identically for registered and unregistered emails', async ({ request }) => {
    const { email } = await registerUser(request, 'f2');

    const known = await request.post('/api/auth/forgot-password', { data: { email } });
    const unknown = await request.post('/api/auth/forgot-password', {
      data: { email: uniqueEmail('nobody') },
    });

    expect(unknown.status()).toBe(known.status());
    expect(await unknown.json()).toEqual(await known.json());
  });

  test('login responds identically for unknown email and wrong password', async ({ request }) => {
    const { email } = await registerUser(request, 'f2login');

    const wrongPassword = await request.post('/api/auth/login', {
      data: { email, password: 'Wrong12345' },
    });
    const unknownEmail = await request.post('/api/auth/login', {
      data: { email: uniqueEmail('nobody'), password: 'Wrong12345' },
    });

    expect(wrongPassword.status()).toBe(401);
    expect(unknownEmail.status()).toBe(401);
    expect(await unknownEmail.json()).toEqual(await wrongPassword.json());
  });
});

test.describe('F3 - Sessions are invalidated on password change', () => {
  test('a token issued before a password change is rejected', async ({ request }) => {
    const { token: oldToken } = await registerUser(request, 'f3');

    const before = await request.get('/api/auth/me', { headers: bearer(oldToken) });
    expect(before.status()).toBe(200);

    // JWT "iat" has one-second precision; make sure the change is clearly later
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const change = await request.put('/api/auth/change-password', {
      headers: bearer(oldToken),
      data: { currentPassword: PASSWORD, newPassword: 'Changed12345' },
    });
    expect(change.status()).toBe(200);
    const newToken = (await change.json()).data.token;

    const withOld = await request.get('/api/auth/me', { headers: bearer(oldToken) });
    expect(withOld.status()).toBe(401);

    const withNew = await request.get('/api/auth/me', { headers: bearer(newToken) });
    expect(withNew.status()).toBe(200);
  });

  test('tokens expire within one day', async ({ request }) => {
    const { token } = await registerUser(request, 'f3exp');

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    expect(payload.exp - payload.iat).toBeLessThanOrEqual(24 * 60 * 60);
  });
});

test.describe('F4 - Profile update cannot change credentials without re-authentication', () => {
  test('password cannot be changed through /profile', async ({ request }) => {
    const { email, token } = await registerUser(request, 'f4');

    const res = await request.put('/api/auth/profile', {
      headers: bearer(token),
      data: { password: 'Stolen12345' },
    });
    expect(res.status()).toBe(400);

    const login = await request.post('/api/auth/login', {
      data: { email, password: 'Stolen12345' },
    });
    expect(login.status()).toBe(401);
  });

  test('email cannot be changed without the current password', async ({ request }) => {
    const { token } = await registerUser(request, 'f4email');

    const res = await request.put('/api/auth/profile', {
      headers: bearer(token),
      data: { email: uniqueEmail('attacker') },
    });
    expect(res.status()).toBe(401);
  });

  test('non-sensitive profile fields can still be updated', async ({ request }) => {
    const { token } = await registerUser(request, 'f4name');

    const res = await request.put('/api/auth/profile', {
      headers: bearer(token),
      data: { name: 'Updated Name' },
    });
    expect(res.status()).toBe(200);
  });
});
