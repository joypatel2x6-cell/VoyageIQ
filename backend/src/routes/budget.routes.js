const express = require('express');
const budgetController = require('../controllers/budget.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

// Require authentication for ALL budget engine endpoints
router.use(requireAuth);

/**
 * @route   GET /api/v1/trips/:tripId/budget
 * @desc    Get dynamic overall trip budget summary & category breakdown
 * @access  Private / Public (if trip is public)
 */
router.get('/', budgetController.getBudgetOverview);

/**
 * @route   GET /api/v1/trips/:tripId/budget/daily
 * @desc    Get daily cost analysis & average daily spending comparison
 * @access  Private / Public (if trip is public)
 */
router.get('/daily', budgetController.getDailyBudget);

/**
 * @route   GET /api/v1/trips/:tripId/budget/insights
 * @desc    Get rule-based smart budget insights & recommendations
 * @access  Private / Public (if trip is public)
 */
router.get('/insights', budgetController.getBudgetInsights);

/**
 * @route   GET /api/v1/trips/:tripId/budget/health
 * @desc    Get trip health score & multi-dimensional evaluation
 * @access  Private / Public (if trip is public)
 */
router.get('/health', budgetController.getTripHealth);

module.exports = router;
