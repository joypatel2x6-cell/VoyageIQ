const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');

/**
 * Controller: Register a new User account
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user,
  });
});

/**
 * Controller: Login existing User
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user,
  });
});

/**
 * Controller: Get authenticated User profile
 * GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    user: req.user,
  });
});

/**
 * Controller: Logout User
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Successfully logged out',
  });
});

/**
 * Controller: Initiate Google OAuth Authorization Redirect
 * GET /api/v1/auth/google
 */
const initiateGoogleAuth = asyncHandler(async (req, res) => {
  const clientId = config.googleClientId;
  const redirectUri = encodeURIComponent(config.googleCallbackUrl);
  const scope = encodeURIComponent('openid profile email');

  if (!clientId || !config.googleClientSecret) {
    console.warn('[WARNING] Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are missing from environment!');
    return res.redirect(`${config.frontendUrl}/auth/google/callback?error=${encodeURIComponent('Google sign-in is not configured on the server. Please check environment variables.')}`);
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;
  res.redirect(authUrl);
});

/**
 * Controller: Google OAuth callback handler
 * GET /api/v1/auth/google/callback
 */
const googleAuthCallback = asyncHandler(async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${config.frontendUrl}/auth/google/callback?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return res.redirect(`${config.frontendUrl}/auth/google/callback?error=${encodeURIComponent('Authorization code is missing from Google callback.')}`);
  }

  try {
    const { user, token } = await authService.handleGoogleCallback(code);
    res.redirect(`${config.frontendUrl}/auth/google/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (err) {
    console.error('Google Auth callback error:', err);
    res.redirect(`${config.frontendUrl}/auth/google/callback?error=${encodeURIComponent(err.message || 'Authentication with Google failed.')}`);
  }
});

module.exports = {
  register,
  login,
  getMe,
  logout,
  initiateGoogleAuth,
  googleAuthCallback,
};
