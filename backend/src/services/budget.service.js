const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const {
  roundMoney,
  calculateCategoryTotals,
  getBudgetStatus,
  calculateDailyBreakdown,
  generateSmartInsights,
  calculateTripHealth,
} = require('../utils/budget.utils');

/**
 * Utility helper to fetch trip and check user access permission
 */
const getTripWithAccessCheck = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  // View permission check
  if (trip.userId !== userId && !trip.isPublic) {
    throw new ApiError(403, 'You do not have permission to view budget information for this private trip');
  }

  return trip;
};

/**
 * Utility helper to check trip ownership (for write operations)
 */
const checkTripOwnership = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  if (trip.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to manage expenses for this trip');
  }

  return trip;
};

/**
 * GET /api/v1/trips/:tripId/budget
 * Dynamic Trip Budget Overview & Category Breakdown
 */
const getTripBudgetOverview = async (tripId, userId) => {
  const trip = await getTripWithAccessCheck(tripId, userId);

  const [expenses, tripStops] = await Promise.all([
    prisma.expense.findMany({
      where: { tripId },
    }),
    prisma.tripStop.findMany({
      where: { tripId },
      include: {
        tripActivities: {
          include: {
            activity: true,
          },
        },
      },
    }),
  ]);

  const { categoryTotals, totalCost } = calculateCategoryTotals(expenses, tripStops);
  const budget = roundMoney(trip.budget || 0);
  const remaining = roundMoney(budget - totalCost);
  const percentageUsed = budget > 0 ? roundMoney((totalCost / budget) * 100) : 0;
  const isOverBudget = totalCost > budget && budget > 0;
  const status = getBudgetStatus(totalCost, budget);

  return {
    tripId: trip.id,
    currency: trip.currency,
    budget,
    totalCost,
    remaining,
    percentageUsed,
    isOverBudget,
    status,
    categoryBreakdown: categoryTotals,
  };
};

/**
 * GET /api/v1/trips/:tripId/budget/daily
 * Daily Cost Analysis for Every Day of the Trip
 */
const getTripDailyBudget = async (tripId, userId) => {
  const trip = await getTripWithAccessCheck(tripId, userId);

  const [expenses, tripStops] = await Promise.all([
    prisma.expense.findMany({
      where: { tripId },
    }),
    prisma.tripStop.findMany({
      where: { tripId },
      include: {
        tripActivities: {
          include: {
            activity: true,
          },
        },
      },
    }),
  ]);

  const result = calculateDailyBreakdown(trip.startDate, trip.endDate, expenses, tripStops);

  return {
    tripId: trip.id,
    currency: trip.currency,
    durationInDays: result.durationInDays,
    averageDailyCost: result.averageDailyCost,
    totalCost: result.totalCost,
    dailyBreakdown: result.dailyBreakdown,
  };
};

/**
 * GET /api/v1/trips/:tripId/budget/insights
 * Rule-Based Smart Budget Recommendations
 */
const getTripBudgetInsights = async (tripId, userId) => {
  const trip = await getTripWithAccessCheck(tripId, userId);

  const [expenses, tripStops] = await Promise.all([
    prisma.expense.findMany({
      where: { tripId },
    }),
    prisma.tripStop.findMany({
      where: { tripId },
      include: {
        tripActivities: {
          include: {
            activity: true,
          },
        },
      },
    }),
  ]);

  const { categoryTotals, totalCost } = calculateCategoryTotals(expenses, tripStops);
  const dailyResult = calculateDailyBreakdown(trip.startDate, trip.endDate, expenses, tripStops);
  const budget = roundMoney(trip.budget || 0);

  const insightsResult = generateSmartInsights(
    budget,
    totalCost,
    categoryTotals,
    dailyResult.dailyBreakdown,
    dailyResult.averageDailyCost,
    trip.currency
  );

  return {
    tripId: trip.id,
    budget,
    totalCost,
    status: insightsResult.status,
    insights: insightsResult.insights,
  };
};

/**
 * GET /api/v1/trips/:tripId/budget/health
 * Trip Health Score & Multi-dimensional Health Analysis
 */
const getTripHealthScore = async (tripId, userId) => {
  const trip = await getTripWithAccessCheck(tripId, userId);

  const [expenses, tripStops] = await Promise.all([
    prisma.expense.findMany({
      where: { tripId },
    }),
    prisma.tripStop.findMany({
      where: { tripId },
      include: {
        tripActivities: {
          include: {
            activity: true,
          },
        },
      },
    }),
  ]);

  const { categoryTotals, totalCost } = calculateCategoryTotals(expenses, tripStops);
  const dailyResult = calculateDailyBreakdown(trip.startDate, trip.endDate, expenses, tripStops);
  const budget = roundMoney(trip.budget || 0);

  const healthData = calculateTripHealth(
    budget,
    totalCost,
    categoryTotals,
    dailyResult.dailyBreakdown,
    tripStops
  );

  return {
    tripId: trip.id,
    score: healthData.score,
    budgetScore: healthData.budgetScore,
    scheduleScore: healthData.scheduleScore,
    dailySpendingScore: healthData.dailySpendingScore,
    activityScore: healthData.activityScore,
    recommendations: healthData.recommendations,
  };
};

/**
 * Helper to check budget threshold and create warning/exceeded notification
 */
const checkBudgetThresholdNotification = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || !trip.budget || parseFloat(trip.budget.toString()) <= 0) return;

  const totalBudget = parseFloat(trip.budget.toString());
  const expenses = await prisma.expense.findMany({ where: { tripId } });
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);

  const percentageUsed = Math.round((totalExpenses / totalBudget) * 100);

  const { createNotification } = require('./notification.service');

  if (totalExpenses > totalBudget) {
    await createNotification(userId, {
      title: 'Budget Exceeded',
      message: `Total expenses for "${trip.name}" (${totalExpenses} ${trip.currency}) have exceeded your budget of ${totalBudget} ${trip.currency}.`,
      type: 'BUDGET_EXCEEDED',
    });
  } else if (percentageUsed >= 80) {
    await createNotification(userId, {
      title: 'Budget Warning',
      message: `You have reached ${percentageUsed}% of your total budget for trip "${trip.name}".`,
      type: 'BUDGET_WARNING',
    });
  }
};

/**
 * POST /api/v1/trips/:tripId/expenses
 * Add a manual expense line-item
 */
const addExpense = async (tripId, userId, payload) => {
  const trip = await checkTripOwnership(tripId, userId);

  const expenseDate = payload.date ? new Date(payload.date) : new Date(trip.startDate);

  const newExpense = await prisma.expense.create({
    data: {
      tripId,
      category: payload.category.toUpperCase(),
      amount: roundMoney(payload.amount),
      currency: payload.currency || trip.currency || 'USD',
      description: payload.description || null,
      date: expenseDate,
    },
  });

  await checkBudgetThresholdNotification(tripId, userId);

  return newExpense;
};

/**
 * PATCH /api/v1/trips/:tripId/expenses/:expenseId
 * Update a manual expense line-item
 */
const updateExpense = async (tripId, expenseId, userId, payload) => {
  await checkTripOwnership(tripId, userId);

  const existingExpense = await prisma.expense.findFirst({
    where: { id: expenseId, tripId },
  });

  if (!existingExpense) {
    throw new ApiError(404, 'Expense not found');
  }

  const updatedExpense = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      ...(payload.category && { category: payload.category.toUpperCase() }),
      ...(payload.amount !== undefined && { amount: roundMoney(payload.amount) }),
      ...(payload.currency && { currency: payload.currency }),
      ...(payload.description !== undefined && { description: payload.description }),
      ...(payload.date && { date: new Date(payload.date) }),
    },
  });

  await checkBudgetThresholdNotification(tripId, userId);

  return updatedExpense;
};

/**
 * DELETE /api/v1/trips/:tripId/expenses/:expenseId
 * Delete a manual expense line-item
 */
const deleteExpense = async (tripId, expenseId, userId) => {
  await checkTripOwnership(tripId, userId);

  const existingExpense = await prisma.expense.findFirst({
    where: { id: expenseId, tripId },
  });

  if (!existingExpense) {
    throw new ApiError(404, 'Expense not found');
  }

  await prisma.expense.delete({
    where: { id: expenseId },
  });

  return {
    success: true,
    message: 'Expense deleted successfully',
  };
};

module.exports = {
  getTripBudgetOverview,
  getTripDailyBudget,
  getTripBudgetInsights,
  getTripHealthScore,
  addExpense,
  updateExpense,
  deleteExpense,
};
