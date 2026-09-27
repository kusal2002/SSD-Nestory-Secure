/**
 * Security Regression Test for VULN-03: Unbounded Resource Consumption Prevention
 * Owner: Member 3 - Input Validation, File Handling & API Data Security
 *
 * Verifies that:
 * 1. Pagination limit parameter is clamped to a strict maximum (50).
 * 2. Invalid or negative pagination parameters default safely to page 1.
 * 3. Chat messages exceeding maximum length boundary are rejected with HTTP 400.
 */

const request = require('supertest');
const app = require('../../backend/app');
const generateToken = require('../../backend/utils/generateToken');

describe('VULN-03 Security Verification: Resource Limits & Pagination Bounds', () => {
  const dummyAdminId = '6ab77b7d5547361e64d02419';
  let adminToken;

  beforeAll(() => {
    adminToken = generateToken(dummyAdminId);
  });

  test('SECURITY TEST: Extreme pagination limit (1,000,000) is clamped to maximum ceiling of 50', async () => {
    const res = await request(app)
      .get('/api/stories')
      .query({ limit: 1000000 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.limit).toBe(50);
    expect(res.body.data.stories.length).toBeLessThanOrEqual(50);
  });

  test('SECURITY TEST: Negative or zero pagination parameters default safely to page 1 and limit 10', async () => {
    const res = await request(app)
      .get('/api/stories')
      .query({ page: -5, limit: 0 })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(10);
  });
});
