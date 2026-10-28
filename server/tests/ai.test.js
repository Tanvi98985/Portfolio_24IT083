import request from 'supertest';
import jwt from 'jsonwebtoken';
import cache from '../cache.js';

/**
 * Practical 13: AI API Integration Tests
 * Runs completely in-memory without external network calls or database dependencies.
 */

// Ensure GEMINI_API_KEY is unset so fallback behavior is verified
delete process.env.GEMINI_API_KEY;
process.env.JWT_SECRET = 'test_secret';

// Dynamically import app so process.env configuration is applied
const { default: app } = await import('../server.js');

describe('AI API Integration - In-Memory Tests', () => {
  // Test 1: Protected endpoint requires JWT token
  it('POST /api/ai/generate-description without token returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/ai/generate-description')
      .send({ title: 'Prepare viva notes' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  // Test 2: Protected request with valid JWT and no API key returns 200 with fallback
  it('POST /api/ai/generate-description with valid JWT and no API key returns 200 fallback', async () => {
    delete process.env.GEMINI_API_KEY;
    const validToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011' },
      'test_secret'
    );

    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Prepare viva notes' });

    expect(res.status).toBe(200);
    expect(res.body.fallback).toBe(true);
    expect(res.body.reason).toBe('not_configured');
    expect(res.body.description).toBe('');
    expect(res.body.message).toContain('not configured');
  });

  // Test 3: Protected request with empty title returns 400 Bad Request
  it('POST /api/ai/generate-description with empty title returns 400 Bad Request', async () => {
    const validToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011' },
      'test_secret'
    );

    const res = await request(app)
      .post('/api/ai/generate-description')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  afterAll(() => {
    cache.close();
  });
});
