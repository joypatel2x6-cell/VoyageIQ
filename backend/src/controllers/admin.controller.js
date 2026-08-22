const adminService = require('../services/admin.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get paginated users list with filters & search
 * GET /api/v1/admin/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getUsers(req.query);
  res.status(200).json({
    success: true,
    message: 'Users list retrieved successfully',
    data: result.users,
    pagination: result.pagination,
  });
});

/**
 * Controller: Get detailed user profile by ID
 * GET /api/v1/admin/users/:userId
 */
const getUserDetail = asyncHandler(async (req, res) => {
  const user = await adminService.getUserDetail(req.params.userId);
  res.status(200).json({
    success: true,
    message: 'User details retrieved successfully',
    user,
  });
});

/**
 * Controller: Update user status or role
 * PATCH /api/v1/admin/users/:userId/status
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const updatedUser = await adminService.updateUserStatus(
    req.params.userId,
    req.body,
    req.user.id
  );
  res.status(200).json({
    success: true,
    message: 'User status updated successfully',
    user: updatedUser,
  });
});

/**
 * Controller: Delete user by ID
 * DELETE /api/v1/admin/users/:userId
 */
const deleteUser = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUser(req.params.userId, req.user.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Controller: Get system statistics metrics
 * GET /api/v1/admin/statistics
 */
const getStatistics = asyncHandler(async (req, res) => {
  const statistics = await adminService.getStatistics();
  res.status(200).json({
    success: true,
    message: 'System statistics retrieved successfully',
    data: statistics,
  });
});

/**
 * Controller: Get popular cities based on trip stops
 * GET /api/v1/admin/popular-cities
 */
const getPopularCities = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const popularCities = await adminService.getPopularCities(limit);
  res.status(200).json({
    success: true,
    message: 'Popular cities retrieved successfully',
    data: popularCities,
  });
});

/**
 * Controller: Get popular activities based on trip activities
 * GET /api/v1/admin/popular-activities
 */
const getPopularActivities = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  const popularActivities = await adminService.getPopularActivities(limit);
  res.status(200).json({
    success: true,
    message: 'Popular activities retrieved successfully',
    data: popularActivities,
  });
});

/**
 * Controller: Get user signup and trip creation trends
 * GET /api/v1/admin/user-trends
 */
const getUserTrends = asyncHandler(async (req, res) => {
  const trends = await adminService.getUserTrends();
  res.status(200).json({
    success: true,
    message: 'User trends retrieved successfully',
    data: trends,
  });
});

module.exports = {
  getUsers,
  getUserDetail,
  updateUserStatus,
  deleteUser,
  getStatistics,
  getPopularCities,
  getPopularActivities,
  getUserTrends,
};
