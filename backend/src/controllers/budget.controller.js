const budgetService = require('../services/budget.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/trips/:tripId/budget
 * Get overall trip budget summary & category breakdown
 */
const getBudgetOverview = asyncHandler(async (req, res) => {
  const data = await budgetService.getTripBudgetOverview(req.params.tripId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Trip budget overview calculated successfully',
    data,
  });
});

/**
 * GET /api/v1/trips/:tripId/budget/daily
 * Get daily cost analysis & average daily spending comparison
 */
const getDailyBudget = asyncHandler(async (req, res) => {
  const data = await budgetService.getTripDailyBudget(req.params.tripId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Daily budget breakdown calculated successfully',
    data,
  });
});

/**
 * GET /api/v1/trips/:tripId/budget/insights
 * Get rule-based smart budget insights & recommendations
 */
const getBudgetInsights = asyncHandler(async (req, res) => {
  const data = await budgetService.getTripBudgetInsights(req.params.tripId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Smart budget insights generated successfully',
    data,
  });
});

/**
 * GET /api/v1/trips/:tripId/budget/health
 * Get trip health score & multi-dimensional evaluation
 */
const getTripHealth = asyncHandler(async (req, res) => {
  const data = await budgetService.getTripHealthScore(req.params.tripId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Trip health score evaluated successfully',
    data,
  });
});

/**
 * POST /api/v1/trips/:tripId/expenses
 * Add a manual expense line-item
 */
const addExpense = asyncHandler(async (req, res) => {
  const expense = await budgetService.addExpense(req.params.tripId, req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Expense added successfully',
    expense,
  });
});

/**
 * PATCH /api/v1/trips/:tripId/expenses/:expenseId
 * Update a manual expense line-item
 */
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await budgetService.updateExpense(
    req.params.tripId,
    req.params.expenseId,
    req.user.id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: 'Expense updated successfully',
    expense,
  });
});

/**
 * DELETE /api/v1/trips/:tripId/expenses/:expenseId
 * Delete a manual expense line-item
 */
const deleteExpense = asyncHandler(async (req, res) => {
  const result = await budgetService.deleteExpense(
    req.params.tripId,
    req.params.expenseId,
    req.user.id
  );
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  getBudgetOverview,
  getDailyBudget,
  getBudgetInsights,
  getTripHealth,
  addExpense,
  updateExpense,
  deleteExpense,
};
