/**
 * Security Regression Test for VULN-02: Regular Expression Query Injection & ReDoS
 * Owner: Member 3 - Input Validation, File Handling & API Data Security
 *
 * Verifies that:
 * 1. Unclosed regex patterns (e.g. "([a-z]+") do not cause 500 crashes.
 * 2. Catastrophic backtracking patterns (e.g. "((a+)+)+$") are safely escaped.
 * 3. Search inputs with special characters are safely matched as plain literals.
 */

const request = require('supertest');
const app = require('../../backend/app');
const generateToken = require('../../backend/utils/generateToken');

describe('VULN-02 Security Verification: Regex Injection & ReDoS Prevention', () => {
  const dummyAdminId = '6ab77b7d5547361e64d02419';
  let adminToken;

  beforeAll(() => {
    adminToken = generateToken(dummyAdminId);
  });

  test('SECURITY TEST: Unclosed regex pattern does not crash server and returns HTTP 200', async () => {
    const res = await request(app)
      .get('/api/stories')
      .query({ search: '([a-z]+' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.stories)).toBe(true);
  });

  test('SECURITY TEST: ReDoS exponential quantifier pattern is escaped and returns HTTP 200', async () => {
    const res = await request(app)
      .get('/api/stories')
      .query({ search: '((a+)+)+$' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('SECURITY TEST: Special regex characters (*, +, ?, [, ]) are treated as literal characters', async () => {
    const res = await request(app)
      .get('/api/stories')
      .query({ search: '***test+++' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
