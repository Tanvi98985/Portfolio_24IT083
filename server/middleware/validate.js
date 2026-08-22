/**
 * Server-Side Validation Middleware
 * Rejects malformed requests with clear 400 Bad Request error messages before touching the database.
 */

// Email regex pattern
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export const validateRegister = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      error: 'Please provide a valid email address.',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long.',
    });
  }

  req.body.email = email.trim().toLowerCase();
  return next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Please provide both email and password.',
    });
  }

  req.body.email = email.trim().toLowerCase();
  return next();
};

export const validateTask = (req, res, next) => {
  const { title } = req.body;

  if (title === undefined || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Task title is required and cannot be empty.',
    });
  }

  if (title.trim().length > 200) {
    return res.status(400).json({
      error: 'Task title cannot exceed 200 characters.',
    });
  }

  req.body.title = title.trim();
  return next();
};
