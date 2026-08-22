const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { sanitizeUser } = require('./auth.service');

/**
 * Get full user profile by ID (excluding passwordHash)
 * @param {string} userId User ID
 */
const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sanitizeUser(user);
};

/**
 * Update allowed fields of user profile
 * @param {string} userId User ID
 * @param {Object} updateData Profile fields to update
 */
const updateUserProfile = async (userId, updateData) => {
  // Explicitly whitelist allowed fields to prevent modification of id, email, passwordHash, createdAt
  const allowedFields = [
    'firstName',
    'lastName',
    'phone',
    'city',
    'country',
    'bio',
    'language',
    'profileImage',
  ];

  const payload = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      payload[field] = updateData[field] === '' ? null : updateData[field];
    }
  }

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'No valid profile fields provided for update');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: payload,
  });

  return sanitizeUser(updatedUser);
};

/**
 * Change authenticated user password
 * @param {string} userId User ID
 * @param {Object} payload { currentPassword, newPassword }
 */
const changeUserPassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  // Prevent reusing exact same password
  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new ApiError(400, 'New password must be different from current password');
  }

  // Hash new password with bcrypt
  const saltRounds = 10;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return {
    success: true,
    message: 'Password changed successfully',
  };
};

/**
 * Delete user account and all related private data safely via cascade
 * @param {string} userId User ID
 */
const deleteUserAccount = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Safely delete user (onDelete: Cascade in schema clears user's trips, saved destinations, posts, comments, likes, notifications)
  await prisma.user.delete({
    where: { id: userId },
  });

  return {
    success: true,
    message: 'User account and associated private data deleted successfully',
  };
};

/**
 * Get all saved destinations for user with city details
 * @param {string} userId User ID
 */
const getSavedDestinations = async (userId) => {
  const savedDestinations = await prisma.savedDestination.findMany({
    where: { userId },
    include: {
      city: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return savedDestinations;
};

/**
 * Save a city destination for user
 * @param {string} userId User ID
 * @param {string} cityId City ID
 */
const saveDestination = async (userId, cityId) => {
  // Check if city exists
  const city = await prisma.city.findUnique({
    where: { id: cityId },
  });

  if (!city) {
    throw new ApiError(404, 'City not found');
  }

  // Check if already saved
  const existing = await prisma.savedDestination.findUnique({
    where: {
      userId_cityId: {
        userId,
        cityId,
      },
    },
  });

  if (existing) {
    throw new ApiError(409, 'Destination is already saved in your profile');
  }

  // Save destination
  const savedDestination = await prisma.savedDestination.create({
    data: {
      userId,
      cityId,
    },
    include: {
      city: true,
    },
  });

  return savedDestination;
};

/**
 * Remove a saved city destination for user
 * @param {string} userId User ID
 * @param {string} cityId City ID
 */
const removeSavedDestination = async (userId, cityId) => {
  const existing = await prisma.savedDestination.findUnique({
    where: {
      userId_cityId: {
        userId,
        cityId,
      },
    },
  });

  if (!existing) {
    throw new ApiError(404, 'Saved destination not found in your profile');
  }

  await prisma.savedDestination.delete({
    where: {
      id: existing.id,
    },
  });

  return {
    success: true,
    message: 'Saved destination removed successfully',
  };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  deleteUserAccount,
  getSavedDestinations,
  saveDestination,
  removeSavedDestination,
};
