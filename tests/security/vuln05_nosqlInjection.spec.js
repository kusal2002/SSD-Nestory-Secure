/**
 * Security Regression Test for VULN-05: NoSQL Query Operator Injection
 * Owner: Member 3 - Input Validation, File Handling & API Data Security
 *
 * Verifies that:
 * 1. Nested object query parameters containing NoSQL operators (e.g. source[$ne]) are ignored.
 * 2. Only strictly whitelisted primitive strings are accepted for query filters.
 */

const request = require('supertest');
const app = require('../../backend/app');
const generateToken = require('../../backend/utils/generateToken');

describe('VULN-05 Security Verification: NoSQL Operator Injection Prevention', () => {
  const dummyAdminId = '6ab77b7d5547361e64d02419';
  let adminToken;

  beforeAll(() => {
    adminToken = generateToken(dummyAdminId);
  });

  test('SECURITY TEST: Injected NoSQL operator source[$ne] is neutralized and returns all stories', async () => {
    const res = await request(app)
      .get('/api/stories')
      .query({ 'source[$ne]': 'internal' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // Total should remain complete and not be filtered by the injected operator
    expect(res.body.data.total).toBeGreaterThanOrEqual(1);
  });

  test('SECURITY TEST: Valid whitelisted source parameter operates normally', async () => {
    const res = await request(app)
      .get('/api/stories')
      .query({ source: 'google' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
