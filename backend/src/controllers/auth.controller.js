const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

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

module.exports = {
  register,
  login,
  getMe,
  logout,
};
