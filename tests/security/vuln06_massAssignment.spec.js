/**
 * Security Regression Test for VULN-06: Mass Assignment & Missing Field Whitelisting
 * Owner: Member 3 - Input Validation, File Handling & API Data Security
 *
 * Verifies that:
 * 1. Non-whitelisted fields (e.g., createdBy, _id, source, injectedRole) are stripped during story creation and update.
 * 2. Invalid ObjectId route parameters are rejected with 400 Bad Request.
 */

const request = require('supertest');
const app = require('../../backend/app');
const generateToken = require('../../backend/utils/generateToken');
const Story = require('../../backend/models/storyLibrary/Story');

describe('VULN-06 Security Verification: Mass Assignment Prevention (CWE-915)', () => {
  const dummyAdminId = '6ab77b7d5547361e64d02419';
  let adminToken;
  let testStoryId;

  beforeAll(async () => {
    adminToken = generateToken(dummyAdminId);

    // Create a temporary story document for update testing
    const story = await Story.create({
      title: 'Mass Assignment Target Story',
      author: 'Security Tester',
      description: 'Testing mass assignment remediation',
      ageGroup: 'middle-grade',
      genres: ['fantasy'],
      readingLevel: 'intermediate',
      source: 'internal',
      createdBy: dummyAdminId
    });
    testStoryId = story._id.toString();
  });

  afterAll(async () => {
    if (testStoryId) {
      await Story.findByIdAndDelete(testStoryId);
    }
  });

  test('SECURITY TEST: Updating story rejects invalid ObjectId format with 400 Bad Request', async () => {
    const res = await request(app)
      .put('/api/stories/invalid-id-format')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'New Title' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid story ID format');
  });

  test('SECURITY TEST: Injected protected fields (createdBy, source) are stripped on story update', async () => {
    const spoofedOwnerId = '000000000000000000000000';
    const res = await request(app)
      .put(`/api/stories/${testStoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Safe Title',
        createdBy: spoofedOwnerId,
        source: 'external_spoofed',
        isAdmin: true
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify in database that createdBy and source were NOT overwritten
    const updatedDoc = await Story.findById(testStoryId);
    expect(updatedDoc.title).toBe('Updated Safe Title');
    expect(updatedDoc.createdBy.toString()).toBe(dummyAdminId);
    expect(updatedDoc.source).toBe('internal');
    expect(updatedDoc.toObject().isAdmin).toBeUndefined();
  });

  test('SECURITY TEST: Injected createdBy field in createStory is overridden by authenticated user ID', async () => {
    const spoofedOwnerId = '999999999999999999999999';
    const res = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'New Story Mass Assignment Test',
        author: 'Security Tester',
        description: 'Testing creation field stripping',
        ageGroup: 'early-readers',
        genres: ['adventure'],
        readingLevel: 'beginner',
        createdBy: spoofedOwnerId,
        maliciousPayload: 'malicious'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.createdBy.toString()).toBe(dummyAdminId);
    expect(res.body.data.maliciousPayload).toBeUndefined();

    // Cleanup created story
    if (res.body.data._id) {
      await Story.findByIdAndDelete(res.body.data._id);
    }
  });
});
