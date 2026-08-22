const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const config = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Generate JWT authentication token
 * @param {Object} payload Payload containing userId and email
 * @returns {string} JWT Token
 */
const generateToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

/**
 * Exclude fields from user object (e.g. passwordHash)
 * @param {Object} user User entity
 * @param {Array<string>} keys Keys to exclude
 * @returns {Object} Clean user object
 */
const sanitizeUser = (user, keys = ['passwordHash']) => {
  if (!user) return null;
  const cleaned = { ...user };
  for (const key of keys) {
    delete cleaned[key];
  }
  return cleaned;
};

/**
 * Register a new user
 * @param {Object} userData User registration payload
 * @returns {Promise<{user: Object, token: string}>}
 */
const registerUser = async (userData) => {
  const normalizedEmail = userData.email.toLowerCase();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Hash password using bcrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(userData.password, saltRounds);

  // Prepare database creation payload
  const newUser = await prisma.user.create({
    data: {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: normalizedEmail,
      phone: userData.phone || null,
      passwordHash,
      city: userData.city || null,
      country: userData.country || null,
      bio: userData.bio || null,
      language: userData.language || 'en',
      profileImage: userData.profileImage || null,
    },
  });

  // Generate JWT token
  const token = generateToken({ userId: newUser.id, email: newUser.email });

  // Return sanitized user (without passwordHash) and token
  const sanitized = sanitizeUser(newUser);

  return {
    user: sanitized,
    token,
  };
};

/**
 * Authenticate existing user login credentials
 * @param {Object} credentials Email and password
 * @returns {Promise<{user: Object, token: string}>}
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase();

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Security: Generic error message to prevent email enumeration
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Compare passwords
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken({ userId: user.id, email: user.email });

  // Return sanitized user (without passwordHash) and token
  const sanitized = sanitizeUser(user);

  return {
    user: sanitized,
    token,
  };
};

/**
 * Get user profile by ID
 * @param {string} userId User ID
 * @returns {Promise<Object>} Sanitized User profile
 */
const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  return sanitizeUser(user);
};

module.exports = {
  generateToken,
  sanitizeUser,
  registerUser,
  loginUser,
  getUserById,
};
