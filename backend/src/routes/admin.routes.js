const express = require('express');
const adminController = require('../controllers/admin.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const {
  userIdParamSchema,
  updateUserStatusSchema,
  getAdminUsersQuerySchema,
} = require('../validators/admin.validator');

const router = express.Router();

// Require Authentication AND Admin Privileges for ALL admin routes
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get paginated users list with filters & search
 * @access  Private (Admin Only)
 */
router.get('/users', validate(getAdminUsersQuerySchema, 'query'), adminController.getUsers);

/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    Get detailed user breakdown
 * @access  Private (Admin Only)
 */
router.get('/users/:userId', validate(userIdParamSchema, 'params'), adminController.getUserDetail);

/**
 * @route   PATCH /api/v1/admin/users/:userId/status
 * @desc    Update user active status or role
 * @access  Private (Admin Only)
 */
router.patch(
  '/users/:userId/status',
  validate(userIdParamSchema, 'params'),
  validate(updateUserStatusSchema),
  adminController.updateUserStatus
);

/**
 * @route   DELETE /api/v1/admin/users/:userId
 * @desc    Delete user account by ID
 * @access  Private (Admin Only)
 */
router.delete('/users/:userId', validate(userIdParamSchema, 'params'), adminController.deleteUser);

/**
 * @route   GET /api/v1/admin/statistics
 * @desc    Get overall system statistics metrics
 * @access  Private (Admin Only)
 */
router.get('/statistics', adminController.getStatistics);

/**
 * @route   GET /api/v1/admin/popular-cities
 * @desc    Get popular cities based on trip stops count
 * @access  Private (Admin Only)
 */
router.get('/popular-cities', adminController.getPopularCities);

/**
 * @route   GET /api/v1/admin/popular-activities
 * @desc    Get popular activities based on trip activities count
 * @access  Private (Admin Only)
 */
router.get('/popular-activities', adminController.getPopularActivities);

/**
 * @route   GET /api/v1/admin/user-trends
 * @desc    Get user registration and trip creation trends
 * @access  Private (Admin Only)
 */
router.get('/user-trends', adminController.getUserTrends);

module.exports = router;
