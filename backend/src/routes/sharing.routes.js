const express = require('express');
const sharingController = require('../controllers/sharing.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  tripIdParamSchema,
  shareTokenParamSchema,
} = require('../validators/sharing.validator');

const router = express.Router();

/**
 * @route   POST /api/v1/trips/:tripId/share
 * @desc    Enable public sharing for a trip & generate secure shareToken
 * @access  Private (Trip Owner)
 */
router.post('/trips/:tripId/share', requireAuth, validate(tripIdParamSchema, 'params'), sharingController.enableShare);

/**
 * @route   DELETE /api/v1/trips/:tripId/share
 * @desc    Disable public sharing for a trip
 * @access  Private (Trip Owner)
 */
router.delete('/trips/:tripId/share', requireAuth, validate(tripIdParamSchema, 'params'), sharingController.disableShare);

/**
 * @route   GET /api/v1/public/trips/:shareToken
 * @desc    Get public read-only trip itinerary
 * @access  Public
 */
router.get('/public/trips/:shareToken', validate(shareTokenParamSchema, 'params'), sharingController.getPublicTrip);

/**
 * @route   POST /api/v1/public/trips/:shareToken/copy
 * @desc    Copy a public trip into the logged-in user's account
 * @access  Private (Authenticated Users)
 */
router.post('/public/trips/:shareToken/copy', requireAuth, validate(shareTokenParamSchema, 'params'), sharingController.copyPublicTrip);

module.exports = router;
