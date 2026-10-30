import request from 'supertest';
import { jest } from '@jest/globals';
import cache from '../cache.js';

/**
 * Contact Form API Integration & Validation Tests
 */

// Dynamically import app so process.env is active
const { default: app } = await import('../server.js');
const { default: ContactMessage } = await import('../models/ContactMessage.js');

describe('Contact Form API - Integration & Validation Tests', () => {
  let createSpy;

  beforeEach(() => {
    // Mock ContactMessage.create so tests don't require live MongoDB connection
    createSpy = jest
      .spyOn(ContactMessage, 'create')
      .mockImplementation(async (data) => ({
        _id: '60d5ec49f1b2c8b1f8e4e1a1',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
  });

  afterEach(() => {
    if (createSpy) {
      createSpy.mockRestore();
    }
  });

  // Clean up cache timer after all tests finish
  afterAll(() => {
    cache.close();
  });

  it('POST /api/contact successfully saves a valid message without authentication', async () => {
    const validPayload = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, I loved your portfolio projects!',
    };

    const res = await request(app)
      .post('/api/contact')
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('sent successfully');
    expect(res.body.id).toBeDefined();
    expect(createSpy).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, I loved your portfolio projects!',
    });
  });

  it('POST /api/contact rejects request when name is missing or empty', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: '   ',
        email: 'john@example.com',
        message: 'Valid message content',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Name is required');
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('POST /api/contact rejects request when email is invalid', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'John Doe',
        email: 'invalid-email-address',
        message: 'Valid message content',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('valid email');
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('POST /api/contact rejects request when message is missing or too short', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hi',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('at least 5 characters');
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('POST /api/contact blocks spam bots when honeypot field is filled', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Spam Bot',
        email: 'spambot@example.com',
        message: 'Buy cheap watches now!',
        _gotcha: 'http://spam-link.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Spam submission detected');
    expect(createSpy).not.toHaveBeenCalled();
  });
});

