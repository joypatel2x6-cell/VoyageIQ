const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const config = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { sanitizeUser } = require('../services/auth.service');

/**
 * Authentication Middleware: requireAuth
 * Protects routes by validating Bearer JWT tokens and attaching user to req.user
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  // 1. Read Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token is required. Please provide a Bearer token');
  }

  // 2. Extract Bearer token
  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new ApiError(401, 'Authentication token is missing');
  }

  // 3. Verify JWT
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Authentication token has expired. Please log in again');
    }
    throw new ApiError(401, 'Invalid authentication token');
  }

  if (!decoded || !decoded.userId) {
    throw new ApiError(401, 'Invalid authentication token payload');
  }

  // 4. Find user in database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new ApiError(401, 'The user belonging to this token no longer exists');
  }

  // 5. Attach sanitized user (without passwordHash) to request
  req.user = sanitizeUser(user);

  // 6. Proceed to next handler
  next();
});

/**
 * Optional Authentication Middleware: optionalAuth
 * Attaches user to req.user if a valid Bearer JWT is provided, but does not block unauthenticated requests.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded && decoded.userId) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      if (user) {
        req.user = sanitizeUser(user);
      }
    }
  } catch (err) {
    req.user = null;
  }

  next();
});

module.exports = {
  requireAuth,
  optionalAuth,
};
