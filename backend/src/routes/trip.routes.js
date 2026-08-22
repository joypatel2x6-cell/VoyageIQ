const express = require('express');
const tripController = require('../controllers/trip.controller');
const tripStopRoutes = require('./tripStop.routes');
const budgetRoutes = require('./budget.routes');
const expenseRoutes = require('./expense.routes');
const calendarRoutes = require('./calendar.routes');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  createTripSchema,
  updateTripSchema,
  getTripsQuerySchema,
  tripIdParamSchema,
} = require('../validators/trip.validator');

const router = express.Router();

// Require authentication for ALL trip endpoints
router.use(requireAuth);

// Mount trip sub-routers
router.use('/:tripId/stops', tripStopRoutes);
router.use('/:tripId/budget', budgetRoutes);
router.use('/:tripId/expenses', expenseRoutes);
router.use('/:tripId', calendarRoutes);

/**
 * @route   POST /api/v1/trips
 * @desc    Create a new trip
 * @access  Private
 */
router.post('/', validate(createTripSchema), tripController.create);

/**
 * @route   GET /api/v1/trips
 * @desc    Get user's trips with filters, search, sorting & pagination
 * @access  Private
 */
router.get('/', validate(getTripsQuerySchema, 'query'), tripController.getMyTrips);

/**
 * @route   GET /api/v1/trips/:tripId
 * @desc    Get detailed trip breakdown by ID
 * @access  Private / Public (if isPublic === true)
 */
router.get('/:tripId', validate(tripIdParamSchema, 'params'), tripController.getDetail);

/**
 * @route   PATCH /api/v1/trips/:tripId
 * @desc    Update existing trip details
 * @access  Private (Owner only)
 */
router.patch(
  '/:tripId',
  validate(tripIdParamSchema, 'params'),
  validate(updateTripSchema),
  tripController.update
);

/**
 * @route   DELETE /api/v1/trips/:tripId
 * @desc    Delete existing trip by ID
 * @access  Private (Owner only)
 */
router.delete('/:tripId', validate(tripIdParamSchema, 'params'), tripController.deleteTrip);

/**
 * @route   POST /api/v1/trips/:tripId/duplicate
 * @desc    Duplicate an existing trip with stops, activities & expenses
 * @access  Private
 */
router.post('/:tripId/duplicate', validate(tripIdParamSchema, 'params'), tripController.duplicate);

module.exports = router;
