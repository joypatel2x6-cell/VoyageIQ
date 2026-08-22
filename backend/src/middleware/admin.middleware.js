const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authorization Middleware: requireAdmin
 * Enforces admin-only access control on endpoints
 * Checks that req.user is authenticated and has role === 'ADMIN'
 */
const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication token is required');
  }

  if (req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Forbidden: Admin access required');
  }

  next();
});

module.exports = {
  requireAdmin,
};
