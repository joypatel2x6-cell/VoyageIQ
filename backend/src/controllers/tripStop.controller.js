const tripStopService = require('../services/tripStop.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Add a stop to a trip
 * POST /api/v1/trips/:tripId/stops
 */
const addStop = asyncHandler(async (req, res) => {
  const stop = await tripStopService.addStop(req.params.tripId, req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Trip stop added successfully',
    stop,
  });
});

/**
 * Controller: Get all stops for a trip
 * GET /api/v1/trips/:tripId/stops
 */
const getStops = asyncHandler(async (req, res) => {
  const stops = await tripStopService.getTripStops(req.params.tripId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Trip stops retrieved successfully',
    stops,
  });
});

/**
 * Controller: Update a trip stop
 * PATCH /api/v1/trips/:tripId/stops/:stopId
 */
const updateStop = asyncHandler(async (req, res) => {
  const updatedStop = await tripStopService.updateStop(
    req.params.tripId,
    req.params.stopId,
    req.user.id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: 'Trip stop updated successfully',
    stop: updatedStop,
  });
});

/**
 * Controller: Delete a trip stop
 * DELETE /api/v1/trips/:tripId/stops/:stopId
 */
const deleteStop = asyncHandler(async (req, res) => {
  const result = await tripStopService.deleteStop(
    req.params.tripId,
    req.params.stopId,
    req.user.id
  );
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Controller: Reorder trip stops via transaction
 * POST /api/v1/trips/:tripId/stops/reorder
 */
const reorderStops = asyncHandler(async (req, res) => {
  const reorderedStops = await tripStopService.reorderStops(
    req.params.tripId,
    req.user.id,
    req.body.stopIds
  );
  res.status(200).json({
    success: true,
    message: 'Trip stops reordered successfully',
    stops: reorderedStops,
  });
});

module.exports = {
  addStop,
  getStops,
  updateStop,
  deleteStop,
  reorderStops,
};
