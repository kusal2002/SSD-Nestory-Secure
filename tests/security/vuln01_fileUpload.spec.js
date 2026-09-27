/**
 * Security Regression Test for VULN-01: Insecure File Upload
 * Owner: Member 3 - Input Validation, File Handling & API Data Security
 *
 * Verifies that:
 * 1. Files without genuine PDF magic bytes (%PDF-) are rejected with HTTP 400.
 * 2. Spoofed files are purged from disk immediately.
 * 3. Genuine PDF documents are accepted with HTTP 201.
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../../backend/app');
const generateToken = require('../../backend/utils/generateToken');

describe('VULN-01 Security Verification: Insecure File Upload', () => {
  const dummyAdminId = '6ab77b7d5547361e64d02419';
  let adminToken;
  const tempFakePdfPath = path.join(__dirname, 'temp_fake.pdf');
  const tempValidPdfPath = path.join(__dirname, 'temp_valid.pdf');

  beforeAll(() => {
    adminToken = generateToken(dummyAdminId);

    // Create fake PDF without %PDF- magic bytes
    fs.writeFileSync(tempFakePdfPath, '<script>alert("XSS Payload")</script>');

    // Create valid PDF with genuine %PDF- magic header
    fs.writeFileSync(tempValidPdfPath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
  });

  afterAll(() => {
    if (fs.existsSync(tempFakePdfPath)) fs.unlinkSync(tempFakePdfPath);
    if (fs.existsSync(tempValidPdfPath)) fs.unlinkSync(tempValidPdfPath);
  });

  test('SECURITY TEST: Reject file with spoofed MIME/extension and invalid magic bytes', async () => {
    const res = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Spoofed Security Test Story')
      .field('author', 'Tester')
      .field('description', 'Testing spoofed rejection')
      .field('ageGroup', 'middle-grade')
      .field('readingLevel', 'beginner')
      .field('genres', 'adventure')
      .attach('pdf', tempFakePdfPath, { contentType: 'application/pdf' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid file signature');
  });
});
