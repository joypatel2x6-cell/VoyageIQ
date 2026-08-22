const asyncHandler = require('../utils/asyncHandler');

/**
 * Health check controller returning API operational status
 * GET /api/v1/health
 */
const getHealth = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VoyageIQ API is running',
  });
});

module.exports = {
  getHealth,
};
