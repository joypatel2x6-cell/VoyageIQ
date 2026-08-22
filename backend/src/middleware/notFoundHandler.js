const ApiError = require('../utils/apiError');

/**
 * Middleware to handle unknown 404 routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};

module.exports = notFoundHandler;
