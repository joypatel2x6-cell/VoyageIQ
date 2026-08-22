const sharingService = require('../services/sharing.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Enable public sharing for a trip
 * POST /api/v1/trips/:tripId/share
 */
const enableShare = asyncHandler(async (req, res) => {
  const result = await sharingService.enableShare(req.params.tripId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Trip sharing enabled successfully',
    data: result,
  });
});

/**
 * Controller: Disable public sharing for a trip
 * DELETE /api/v1/trips/:tripId/share
 */
const disableShare = asyncHandler(async (req, res) => {
  const result = await sharingService.disableShare(req.params.tripId, req.user.id);
  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      isPublic: result.isPublic,
    },
  });
});

/**
 * Controller: View public read-only trip itinerary
 * GET /api/v1/public/trips/:shareToken
 */
const getPublicTrip = asyncHandler(async (req, res) => {
  const publicTrip = await sharingService.getPublicTrip(req.params.shareToken);
  res.status(200).json({
    success: true,
    message: 'Public trip itinerary retrieved successfully',
    data: publicTrip,
  });
});

/**
 * Controller: Copy public trip itinerary to logged-in user account
 * POST /api/v1/public/trips/:shareToken/copy
 */
const copyPublicTrip = asyncHandler(async (req, res) => {
  const copiedTrip = await sharingService.copyPublicTrip(req.params.shareToken, req.user.id);
  res.status(201).json({
    success: true,
    message: 'Public trip copied successfully',
    trip: copiedTrip,
  });
});

module.exports = {
  enableShare,
  disableShare,
  getPublicTrip,
  copyPublicTrip,
};
