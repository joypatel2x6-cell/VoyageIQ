const express = require('express');
const aiController = require('../controllers/ai.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route   POST /api/v1/ai/generate-itinerary
 * @desc    Generate a custom trip itinerary using OpenRouter AI
 * @access  Public / Optional Auth
 */
router.post('/generate-itinerary', optionalAuth, aiController.generateItinerary);

module.exports = router;
