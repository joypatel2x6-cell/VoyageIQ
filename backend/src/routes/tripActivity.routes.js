const express = require('express');
const tripActivityController = require('../controllers/tripActivity.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  addTripActivitySchema,
  updateTripActivitySchema,
  reorderTripActivitiesSchema,
} = require('../validators/tripActivity.validator');

const router = express.Router({ mergeParams: true });

// Require authentication for ALL trip activity endpoints
router.use(requireAuth);

/**
 * @route   POST /api/v1/trips/:tripId/stops/:stopId/activities
 * @desc    Schedule an activity in a trip stop
 * @access  Private (Trip owner only)
 */
router.post('/', validate(addTripActivitySchema), tripActivityController.addTripActivity);

/**
 * @route   GET /api/v1/trips/:tripId/stops/:stopId/activities
 * @desc    Get all activities scheduled for a trip stop
 * @access  Private / Public (if trip is public)
 */
router.get('/', tripActivityController.getTripActivities);

/**
 * @route   POST /api/v1/trips/:tripId/stops/:stopId/activities/reorder
 * @desc    Reorder scheduled activities in trip stop using a database transaction
 * @access  Private (Trip owner only)
 */
router.post('/reorder', validate(reorderTripActivitiesSchema), tripActivityController.reorderTripActivities);

/**
 * @route   PATCH /api/v1/trips/:tripId/stops/:stopId/activities/:tripActivityId
 * @desc    Update a scheduled trip activity
 * @access  Private (Trip owner only)
 */
router.patch('/:tripActivityId', validate(updateTripActivitySchema), tripActivityController.updateTripActivity);

/**
 * @route   DELETE /api/v1/trips/:tripId/stops/:stopId/activities/:tripActivityId
 * @desc    Remove an activity from a trip stop
 * @access  Private (Trip owner only)
 */
router.delete('/:tripActivityId', tripActivityController.deleteTripActivity);

module.exports = router;
