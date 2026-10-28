import request from 'supertest';
import jwt from 'jsonwebtoken';
import cache from '../cache.js';

/**
 * Practical 12: CI/CD Pipeline Automated API Tests
 * Tests run in-memory without requiring a live MongoDB connection or internet access.
 */

// Set test environment variable BEFORE importing server module
process.env.JWT_SECRET = 'test_secret';

// Dynamically import app so process.env.JWT_SECRET is active
const { default: app } = await import('../server.js');

describe('Task Manager API - In-Memory Integration Tests', () => {
  // Test 1: Health check endpoint
  it('GET /api/health returns 200 and status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.message).toContain('running');
  });

  // Test 2: Protected route without Authorization header
  it('GET /tasks without token returns 401 Unauthorized', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  // Test 3: Protected route with invalid / tampered token
  it('GET /tasks with invalid token returns 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/tasks')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  // Test 4: Protected cache statistics with valid JWT
  it('GET /tasks/cache/stats with valid JWT returns 200 and numeric stats', async () => {
    const validToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011' },
      'test_secret'
    );

    const res = await request(app)
      .get('/tasks/cache/stats')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.hits).toBe('number');
    expect(typeof res.body.misses).toBe('number');
  });

  // Test 5: 404 handler for unknown routes
  it('GET /unknown-route returns 404 Route not found', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  // Clean up cache timer after all tests finish
  afterAll(() => {
    cache.close();
  });
});
