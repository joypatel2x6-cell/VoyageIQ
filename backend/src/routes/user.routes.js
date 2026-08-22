const express = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  updateProfileSchema,
  changePasswordSchema,
  cityIdParamSchema,
} = require('../validators/user.validator');

const router = express.Router();

// Require authentication for ALL user profile endpoints
router.use(requireAuth);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get authenticated user profile
 * @access  Private
 */
router.get('/me', userController.getProfile);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update authenticated user profile
 * @access  Private
 */
router.patch('/me', validate(updateProfileSchema), userController.updateProfile);

/**
 * @route   PATCH /api/v1/users/me/password
 * @desc    Change authenticated user password
 * @access  Private
 */
router.patch('/me/password', validate(changePasswordSchema), userController.changePassword);

/**
 * @route   DELETE /api/v1/users/me
 * @desc    Delete authenticated user account
 * @access  Private
 */
router.delete('/me', userController.deleteAccount);

/**
 * @route   GET /api/v1/users/me/saved-destinations
 * @desc    Get authenticated user's saved destinations
 * @access  Private
 */
router.get('/me/saved-destinations', userController.getSavedDestinations);

/**
 * @route   POST /api/v1/users/me/saved-destinations/:cityId
 * @desc    Save a destination to user profile
 * @access  Private
 */
router.post(
  '/me/saved-destinations/:cityId',
  validate(cityIdParamSchema, 'params'),
  userController.addSavedDestination
);

/**
 * @route   DELETE /api/v1/users/me/saved-destinations/:cityId
 * @desc    Remove a saved destination from user profile
 * @access  Private
 */
router.delete(
  '/me/saved-destinations/:cityId',
  validate(cityIdParamSchema, 'params'),
  userController.deleteSavedDestination
);

module.exports = router;
