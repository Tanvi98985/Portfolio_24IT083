import { Router } from 'express';
import ContactMessage from '../models/ContactMessage.js';
import { validateContact } from '../middleware/validate.js';

const router = Router();

// In-memory rate limiting map for basic spam protection: IP -> [timestamps]
const ipSubmissionTimestamps = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_SUBMISSIONS_PER_WINDOW = 5;

// Middleware for basic rate limiting / spam prevention
const spamProtection = (req, res, next) => {
  // 1. Honeypot check (hidden field bots usually fill out)
  if (req.body._gotcha || req.body.website) {
    return res.status(400).json({
      error: 'Spam submission detected.',
    });
  }

  // 2. IP rate limiting
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  const now = Date.now();
  const timestamps = (ipSubmissionTimestamps.get(clientIp) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many messages sent. Please wait a few minutes before trying again.',
    });
  }

  timestamps.push(now);
  ipSubmissionTimestamps.set(clientIp, timestamps);

  next();
};

/**
 * POST /api/contact
 * Public endpoint — saves a contact form submission to MongoDB.
 * No JWT authentication required.
 */
router.post('/', spamProtection, validateContact, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const contactMessage = await ContactMessage.create({
      name,
      email,
      message,
    });

    res.status(201).json({
      message: 'Your message has been sent successfully!',
      id: contactMessage._id,
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({
        error: firstError.message,
      });
    }

    console.error('[Contact Error]', error);
    res.status(500).json({
      error: 'Failed to send message. Please try again later.',
    });
  }
});

export default router;

