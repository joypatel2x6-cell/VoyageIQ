const tripActivityService = require('../services/tripActivity.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Add activity to a trip stop
 * POST /api/v1/trips/:tripId/stops/:stopId/activities
 */
const addTripActivity = asyncHandler(async (req, res) => {
  const tripActivity = await tripActivityService.addTripActivity(
    req.params.tripId,
    req.params.stopId,
    req.user.id,
    req.body
  );
  res.status(201).json({
    success: true,
    message: 'Activity scheduled for trip stop successfully',
    tripActivity,
  });
});

/**
 * Controller: Get all activities scheduled for a trip stop
 * GET /api/v1/trips/:tripId/stops/:stopId/activities
 */
const getTripActivities = asyncHandler(async (req, res) => {
  const activities = await tripActivityService.getTripActivities(
    req.params.tripId,
    req.params.stopId,
    req.user.id
  );
  res.status(200).json({
    success: true,
    message: 'Trip stop activities retrieved successfully',
    activities,
  });
});

/**
 * Controller: Update scheduled trip activity
 * PATCH /api/v1/trips/:tripId/stops/:stopId/activities/:tripActivityId
 */
const updateTripActivity = asyncHandler(async (req, res) => {
  const updatedTripActivity = await tripActivityService.updateTripActivity(
    req.params.tripId,
    req.params.stopId,
    req.params.tripActivityId,
    req.user.id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: 'Scheduled trip activity updated successfully',
    tripActivity: updatedTripActivity,
  });
});

/**
 * Controller: Delete scheduled activity from a trip stop
 * DELETE /api/v1/trips/:tripId/stops/:stopId/activities/:tripActivityId
 */
const deleteTripActivity = asyncHandler(async (req, res) => {
  const result = await tripActivityService.deleteTripActivity(
    req.params.tripId,
    req.params.stopId,
    req.params.tripActivityId,
    req.user.id
  );
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Controller: Reorder activities inside a trip stop via transaction
 * POST /api/v1/trips/:tripId/stops/:stopId/activities/reorder
 */
const reorderTripActivities = asyncHandler(async (req, res) => {
  const orderedIds = req.body.tripActivityIds || req.body.activityIds;
  const reorderedActivities = await tripActivityService.reorderTripActivities(
    req.params.tripId,
    req.params.stopId,
    req.user.id,
    orderedIds
  );
  res.status(200).json({
    success: true,
    message: 'Trip stop activities reordered successfully',
    activities: reorderedActivities,
  });
});

module.exports = {
  addTripActivity,
  getTripActivities,
  updateTripActivity,
  deleteTripActivity,
  reorderTripActivities,
};
