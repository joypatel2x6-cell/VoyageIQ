const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get authenticated user profile
 * GET /api/v1/users/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getUserProfile(req.user.id);
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    user: profile,
  });
});

/**
 * Update authenticated user profile
 * PATCH /api/v1/users/me
 */
const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserProfile(req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: 'User profile updated successfully',
    user: updatedUser,
  });
});

/**
 * Change authenticated user password
 * PATCH /api/v1/users/me/password
 */
const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.changeUserPassword(req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Delete authenticated user account
 * DELETE /api/v1/users/me
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const result = await userService.deleteUserAccount(req.user.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Get authenticated user's saved destinations
 * GET /api/v1/users/me/saved-destinations
 */
const getSavedDestinations = asyncHandler(async (req, res) => {
  const savedDestinations = await userService.getSavedDestinations(req.user.id);
  res.status(200).json({
    success: true,
    message: 'Saved destinations retrieved successfully',
    savedDestinations,
  });
});

/**
 * Add a saved destination for authenticated user
 * POST /api/v1/users/me/saved-destinations/:cityId
 */
const addSavedDestination = asyncHandler(async (req, res) => {
  const savedDestination = await userService.saveDestination(req.user.id, req.params.cityId);
  res.status(201).json({
    success: true,
    message: 'Destination saved successfully',
    savedDestination,
  });
});

/**
 * Remove a saved destination for authenticated user
 * DELETE /api/v1/users/me/saved-destinations/:cityId
 */
const deleteSavedDestination = asyncHandler(async (req, res) => {
  const result = await userService.removeSavedDestination(req.user.id, req.params.cityId);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getSavedDestinations,
  addSavedDestination,
  deleteSavedDestination,
};
