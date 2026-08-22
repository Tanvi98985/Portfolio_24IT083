import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * 
 * Verifies JWT token from the Authorization header: `Bearer <token>`.
 * Attaches decoded user payload (`req.user = decoded`) on success.
 * Catches all errors and returns 401 Unauthorized instead of throwing uncaught exceptions.
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: Access token is missing or malformed.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized: Access token is missing.',
      });
    }

    const secret = process.env.JWT_SECRET || 'supersecretjwtkey_tanvi_portfolio_2026';
    const decoded = jwt.verify(token, secret);

    req.user = decoded;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized: Token has expired. Please log in again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or tampered token.',
      });
    }
    return res.status(401).json({
      error: 'Unauthorized: Authentication failed.',
    });
  }
};

export default authMiddleware;
