const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user account
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & get JWT token
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   GET /api/v1/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get('/google', authController.initiateGoogleAuth);

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Google OAuth Callback endpoint
 * @access  Public
 */
router.get('/google/callback', authController.googleAuthCallback);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (Requires JWT)
 */
router.get('/me', requireAuth, authController.getMe);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (stateless JWT client notification response)
 * @access  Public / Private
 */
router.post('/logout', authController.logout);

module.exports = router;
