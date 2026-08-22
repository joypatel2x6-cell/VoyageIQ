const activityService = require('../services/activity.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get paginated activities with filters (cityId, category, cost, duration, rating) & sorting
 * GET /api/v1/activities
 */
const getActivities = asyncHandler(async (req, res) => {
  const result = await activityService.getActivities(req.query);
  res.status(200).json({
    success: true,
    message: 'Activities retrieved successfully',
    data: result.activities,
    pagination: result.pagination,
  });
});

/**
 * Controller: Dedicated Activity Search
 * GET /api/v1/activities/search
 */
const search = asyncHandler(async (req, res) => {
  const result = await activityService.searchActivities(req.query);
  res.status(200).json({
    success: true,
    message: 'Activity search results retrieved successfully',
    data: result.activities,
    pagination: result.pagination,
  });
});

/**
 * Controller: Get Activity details by ID
 * GET /api/v1/activities/:activityId
 */
const getActivityById = asyncHandler(async (req, res) => {
  const activity = await activityService.getActivityById(req.params.activityId);
  res.status(200).json({
    success: true,
    message: 'Activity details retrieved successfully',
    activity,
  });
});

/**
 * Controller: Get Activities for a specific City
 * GET /api/v1/cities/:cityId/activities
 */
const getCityActivities = asyncHandler(async (req, res) => {
  const result = await activityService.getCityActivities(req.params.cityId, req.query);
  res.status(200).json({
    success: true,
    message: 'City activities retrieved successfully',
    city: result.city,
    data: result.activities,
    pagination: result.pagination,
  });
});

module.exports = {
  getActivities,
  search,
  getActivityById,
  getCityActivities,
};
