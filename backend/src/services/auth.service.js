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

/**
 * Handle Google OAuth callback: exchange code for profile details and find/create user
 * @param {string} code Authorization code from Google redirect
 * @returns {Promise<{user: Object, token: string}>}
 */
const handleGoogleCallback = async (code) => {
  // 1. Exchange auth code for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleCallbackUrl,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    console.error('Google token exchange error details:', errorBody);
    throw new ApiError(400, 'Failed to exchange authorization code with Google.');
  }

  const tokens = await tokenResponse.json();

  // 2. Fetch user profile using access token
  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  if (!profileResponse.ok) {
    throw new ApiError(400, 'Failed to fetch user profile from Google.');
  }

  const profile = await profileResponse.json();

  if (!profile.email) {
    throw new ApiError(400, 'Google account is missing a verified email address.');
  }

  const emailNormalized = profile.email.toLowerCase();

  // 3. Find user by googleId
  let user = await prisma.user.findUnique({
    where: { googleId: profile.sub },
  });

  // 4. If not found by googleId, lookup by email (for email/password match)
  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (user) {
      // Safely link the Google identity to existing local account
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.sub,
          authProvider: 'google',
          // Optionally preserve/update profile image if it is missing
          profileImage: user.profileImage || profile.picture || null,
        },
      });
    }
  }

  // 5. If user still does not exist, create a new record
  if (!user) {
    user = await prisma.user.create({
      data: {
        firstName: profile.given_name || 'Google',
        lastName: profile.family_name || 'User',
        email: emailNormalized,
        googleId: profile.sub,
        authProvider: 'google',
        profileImage: profile.picture || null,
        passwordHash: null, // Google logins don't have passwords
      },
    });
  }

  // 6. Generate VoyageIQ session JWT token
  const sessionToken = generateToken({ userId: user.id, email: user.email });

  return {
    user: sanitizeUser(user),
    token: sessionToken,
  };
};

module.exports = {
  generateToken,
  sanitizeUser,
  registerUser,
  loginUser,
  getUserById,
  handleGoogleCallback,
};
