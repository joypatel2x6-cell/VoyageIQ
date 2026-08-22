const cityService = require('../services/city.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get paginated cities with filters & sorting
 * GET /api/v1/cities
 */
const getCities = asyncHandler(async (req, res) => {
  const result = await cityService.getCities(req.query);
  res.status(200).json({
    success: true,
    message: 'Cities retrieved successfully',
    data: result.cities,
    pagination: result.pagination,
  });
});

/**
 * Controller: Dedicated City Search
 * GET /api/v1/cities/search
 */
const search = asyncHandler(async (req, res) => {
  const result = await cityService.searchCities(req.query);
  res.status(200).json({
    success: true,
    message: 'City search results retrieved successfully',
    data: result.cities,
    pagination: result.pagination,
  });
});

/**
 * Controller: Get City by ID
 * GET /api/v1/cities/:cityId
 */
const getCityById = asyncHandler(async (req, res) => {
  const city = await cityService.getCityById(req.params.cityId);
  res.status(200).json({
    success: true,
    message: 'City details retrieved successfully',
    city,
  });
});

/**
 * Controller: Get Activities for a specific City
 * GET /api/v1/cities/:cityId/activities
 */
const getCityActivities = asyncHandler(async (req, res) => {
  const result = await cityService.getCityActivities(req.params.cityId, req.query);
  res.status(200).json({
    success: true,
    message: 'City activities retrieved successfully',
    city: result.city,
    data: result.activities,
    pagination: result.pagination,
  });
});

module.exports = {
  getCities,
  search,
  getCityById,
  getCityActivities,
};
