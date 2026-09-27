/**
 * Security Regression Test for VULN-04: API Error & Database Information Disclosure
 * Owner: Member 3 - Input Validation, File Handling & API Data Security
 *
 * Verifies that:
 * 1. Non-ObjectId strings return 400 Bad Request instead of 500 crashes.
 * 2. Database model names (e.g. "SearchRequest", "Story") are never leaked in responses.
 * 3. Schema paths and CastError details are not exposed to clients.
 */

const request = require('supertest');
const app = require('../../backend/app');
const generateToken = require('../../backend/utils/generateToken');

describe('VULN-04 Security Verification: Database Schema & CastError Sanitization', () => {
  const dummyAdminId = '6ab77b7d5547361e64d02419';
  let adminToken;

  beforeAll(() => {
    adminToken = generateToken(dummyAdminId);
  });

  test('SECURITY TEST: Invalid ObjectId parameter is sanitized and does not leak CastError/model schema', async () => {
    const res = await request(app)
      .put('/api/search-requests/invalid-object-id-123/reviewing')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid search request ID format');
    // Ensure internal model name and CastError string are NEVER in the body
    expect(JSON.stringify(res.body)).not.toContain('Cast to ObjectId');
    expect(JSON.stringify(res.body)).not.toContain('SearchRequest');
  });

  test('SECURITY TEST: Story access check validates ID format and does not leak Mongoose internals', async () => {
    const res = await request(app)
      .get('/api/stories/invalid-story-id/access/invalid-child-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid ID format provided');
    expect(JSON.stringify(res.body)).not.toContain('Cast to ObjectId');
  });
});
