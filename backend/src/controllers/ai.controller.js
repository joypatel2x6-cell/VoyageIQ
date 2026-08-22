const asyncHandler = require('../utils/asyncHandler');
const aiService = require('../services/ai.service');

/**
 * @desc    Generate AI Itinerary via OpenRouter
 * @route   POST /api/v1/ai/generate-itinerary
 * @access  Public / Private
 */
const generateItinerary = asyncHandler(async (req, res) => {
  const {
    destination,
    startDate,
    endDate,
    budgetLimit,
    currency,
    travelStyle,
    travelersCount,
    tripName,
    notes,
  } = req.body;

  if (!destination || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Destination, startDate, and endDate are required fields.',
    });
  }

  try {
    const itinerary = await aiService.generateItinerary({
      destination,
      startDate,
      endDate,
      budgetLimit,
      currency,
      travelStyle,
      travelersCount,
      tripName,
      notes,
    });

    return res.status(200).json({
      success: true,
      data: itinerary,
    });
  } catch (error) {
    console.error('AI Generation Controller Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI itinerary.',
    });
  }
});

module.exports = {
  generateItinerary,
};
