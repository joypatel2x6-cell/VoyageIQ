const express = require('express');
const budgetController = require('../controllers/budget.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  addExpenseSchema,
  updateExpenseSchema,
} = require('../validators/budget.validator');

const router = express.Router({ mergeParams: true });

// Require authentication for ALL expense endpoints
router.use(requireAuth);

/**
 * @route   POST /api/v1/trips/:tripId/expenses
 * @desc    Add a manual expense line-item
 * @access  Private (Trip owner only)
 */
router.post('/', validate(addExpenseSchema), budgetController.addExpense);

/**
 * @route   PATCH /api/v1/trips/:tripId/expenses/:expenseId
 * @desc    Update a manual expense line-item
 * @access  Private (Trip owner only)
 */
router.patch('/:expenseId', validate(updateExpenseSchema), budgetController.updateExpense);

/**
 * @route   DELETE /api/v1/trips/:tripId/expenses/:expenseId
 * @desc    Delete a manual expense line-item
 * @access  Private (Trip owner only)
 */
router.delete('/:expenseId', budgetController.deleteExpense);

module.exports = router;
