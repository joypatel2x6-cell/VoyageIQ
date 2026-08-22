const express = require('express');
const tripStopController = require('../controllers/tripStop.controller');
const tripActivityRoutes = require('./tripActivity.routes');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  addStopSchema,
  updateStopSchema,
  reorderStopsSchema,
} = require('../validators/tripStop.validator');

const router = express.Router({ mergeParams: true });

// Require authentication for ALL trip stop endpoints
router.use(requireAuth);

// Mount trip activities sub-router
router.use('/:stopId/activities', tripActivityRoutes);

/**
 * @route   POST /api/v1/trips/:tripId/stops
 * @desc    Add a new stop to trip
 * @access  Private (Trip owner only)
 */
router.post('/', validate(addStopSchema), tripStopController.addStop);

/**
 * @route   GET /api/v1/trips/:tripId/stops
 * @desc    Get all stops for trip
 * @access  Private / Public (if trip is public)
 */
router.get('/', tripStopController.getStops);

/**
 * @route   POST /api/v1/trips/:tripId/stops/reorder
 * @desc    Reorder stops for trip using database transaction
 * @access  Private (Trip owner only)
 */
router.post('/reorder', validate(reorderStopsSchema), tripStopController.reorderStops);

/**
 * @route   PATCH /api/v1/trips/:tripId/stops/:stopId
 * @desc    Update trip stop
 * @access  Private (Trip owner only)
 */
router.patch('/:stopId', validate(updateStopSchema), tripStopController.updateStop);

/**
 * @route   DELETE /api/v1/trips/:tripId/stops/:stopId
 * @desc    Delete trip stop (clears trip activities safely without deleting global city)
 * @access  Private (Trip owner only)
 */
router.delete('/:stopId', tripStopController.deleteStop);

module.exports = router;
