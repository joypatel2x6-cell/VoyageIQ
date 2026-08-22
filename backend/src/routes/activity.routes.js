const express = require('express');
const activityController = require('../controllers/activity.controller');
const validate = require('../middleware/validate');
const {
  getActivitiesQuerySchema,
  activitySearchQuerySchema,
  activityIdParamSchema,
} = require('../validators/activity.validator');

const router = express.Router();

/**
 * @route   GET /api/v1/activities
 * @desc    Get all activities with filtering (cityId, category, minCost, maxCost, duration, rating) & sorting
 * @access  Public (No authentication required)
 */
router.get('/', validate(getActivitiesQuerySchema, 'query'), activityController.getActivities);

/**
 * @route   GET /api/v1/activities/search
 * @desc    Dedicated partial text search for activities across name & description
 * @access  Public (No authentication required)
 */
router.get('/search', validate(activitySearchQuerySchema, 'query'), activityController.search);

/**
 * @route   GET /api/v1/activities/:activityId
 * @desc    Get detailed activity information by ID
 * @access  Public (No authentication required)
 */
router.get('/:activityId', validate(activityIdParamSchema, 'params'), activityController.getActivityById);

module.exports = router;
