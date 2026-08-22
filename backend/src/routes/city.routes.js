const express = require('express');
const cityController = require('../controllers/city.controller');
const validate = require('../middleware/validate');
const {
  getCitiesQuerySchema,
  citySearchQuerySchema,
  cityIdParamSchema,
  getCityActivitiesQuerySchema,
} = require('../validators/city.validator');

const router = express.Router();

/**
 * @route   GET /api/v1/cities
 * @desc    Get all cities with filtering (country, region, cost, popularity) & sorting
 * @access  Public (No authentication required)
 */
router.get('/', validate(getCitiesQuerySchema, 'query'), cityController.getCities);

/**
 * @route   GET /api/v1/cities/search
 * @desc    Dedicated partial text search for cities across name, country, and region
 * @access  Public (No authentication required)
 */
router.get('/search', validate(citySearchQuerySchema, 'query'), cityController.search);

/**
 * @route   GET /api/v1/cities/:cityId
 * @desc    Get detailed city information by ID
 * @access  Public (No authentication required)
 */
router.get('/:cityId', validate(cityIdParamSchema, 'params'), cityController.getCityById);

/**
 * @route   GET /api/v1/cities/:cityId/activities
 * @desc    Get activities available in a specific city
 * @access  Public (No authentication required)
 */
router.get(
  '/:cityId/activities',
  validate(cityIdParamSchema, 'params'),
  validate(getCityActivitiesQuerySchema, 'query'),
  cityController.getCityActivities
);

module.exports = router;
