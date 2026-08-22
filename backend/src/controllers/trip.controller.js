const tripService = require('../services/trip.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Create a new Trip
 * POST /api/v1/trips
 */
const create = asyncHandler(async (req, res) => {
  const trip = await tripService.createTrip(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Trip created successfully',
    trip,
  });
});

/**
 * Controller: Get authenticated user's trips with pagination, filters & search
 * GET /api/v1/trips
 */
const getMyTrips = asyncHandler(async (req, res) => {
  const result = await tripService.getUserTrips(req.user.id, req.query);
  res.status(200).json({
    success: true,
    message: 'Trips retrieved successfully',
    data: result,
  });
});

/**
 * Controller: Get detailed Trip breakdown with owner summary, stops & budget
 * GET /api/v1/trips/:tripId
 */
const getDetail = asyncHandler(async (req, res) => {
  const detail = await tripService.getTripDetail(req.params.tripId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Trip details retrieved successfully',
    ...detail,
  });
});

/**
 * Controller: Update existing Trip
 * PATCH /api/v1/trips/:tripId
 */
const update = asyncHandler(async (req, res) => {
  const updatedTrip = await tripService.updateTrip(req.params.tripId, req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Trip updated successfully',
    trip: updatedTrip,
  });
});

/**
 * Controller: Delete Trip by ID
 * DELETE /api/v1/trips/:tripId
 */
const deleteTrip = asyncHandler(async (req, res) => {
  const result = await tripService.deleteTrip(req.params.tripId, req.user.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Controller: Duplicate an existing Trip with stops, activities, and expenses
 * POST /api/v1/trips/:tripId/duplicate
 */
const duplicate = asyncHandler(async (req, res) => {
  const duplicatedTrip = await tripService.duplicateTrip(req.params.tripId, req.user.id);
  res.status(201).json({
    success: true,
    message: 'Trip duplicated successfully',
    trip: duplicatedTrip,
  });
});

module.exports = {
  create,
  getMyTrips,
  getDetail,
  update,
  deleteTrip,
  duplicate,
};
