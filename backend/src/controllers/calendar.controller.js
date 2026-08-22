const calendarService = require('../services/calendar.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/trips/:tripId/calendar
 * Comprehensive trip calendar view with daily totals
 */
const getCalendar = asyncHandler(async (req, res) => {
  const data = await calendarService.getTripCalendar(req.params.tripId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Trip calendar retrieved successfully',
    data,
  });
});

/**
 * GET /api/v1/trips/:tripId/timeline
 * Chronologically grouped timeline for frontend itinerary UI
 */
const getTimeline = asyncHandler(async (req, res) => {
  const data = await calendarService.getTripTimeline(req.params.tripId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Trip timeline retrieved successfully',
    data,
  });
});

/**
 * GET /api/v1/trips/:tripId/days/:date
 * Single day itinerary detail breakdown
 */
const getDayDetail = asyncHandler(async (req, res) => {
  const data = await calendarService.getSingleDayDetail(req.params.tripId, req.params.date, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Single day detail retrieved successfully',
    data,
  });
});

module.exports = {
  getCalendar,
  getTimeline,
  getDayDetail,
};
