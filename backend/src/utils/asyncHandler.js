/**
 * Express async route handler wrapper to catch rejected promises and forward errors to error middleware
 * @param {Function} fn Async controller function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = asyncHandler;
