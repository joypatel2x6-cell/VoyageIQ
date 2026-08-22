const express = require('express');
const calendarController = require('../controllers/calendar.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const { dayParamSchema } = require('../validators/calendar.validator');

const router = express.Router({ mergeParams: true });

// Require authentication for ALL calendar & timeline endpoints
router.use(requireAuth);

/**
 * @route   GET /api/v1/trips/:tripId/calendar
 * @desc    Get full calendar view with daily totals & stop overlaps
 * @access  Private / Public (if trip is public)
 */
router.get('/calendar', calendarController.getCalendar);

/**
 * @route   GET /api/v1/trips/:tripId/timeline
 * @desc    Get chronologically grouped timeline view
 * @access  Private / Public (if trip is public)
 */
router.get('/timeline', calendarController.getTimeline);

/**
 * @route   GET /api/v1/trips/:tripId/days/:date
 * @desc    Get single day itinerary & cost breakdown
 * @access  Private / Public (if trip is public)
 */
router.get('/days/:date', validate(dayParamSchema, 'params'), calendarController.getDayDetail);

module.exports = router;
