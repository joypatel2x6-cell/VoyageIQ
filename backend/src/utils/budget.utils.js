/**
 * VoyageIQ Smart Budget Engine - Utility & Calculation Helper
 * Provides decimal-safe money calculations, category breakdowns, daily analysis,
 * rule-based smart insights, and holistic trip health score algorithms.
 */

/**
 * Safely round money values to 2 decimal places to prevent floating point inaccuracies
 * @param {number|string} value
 * @returns {number}
 */
const roundMoney = (value) => {
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculate stay duration in days between start and end dates
 */
const calculateDurationInDays = (startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

/**
 * Generate date array formatted as YYYY-MM-DD for every day in the trip range
 */
const generateTripDateList = (startDate, endDate) => {
  const dates = [];
  const curr = new Date(startDate);
  const end = new Date(endDate);

  // Normalize to UTC start of day
  curr.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return dates;
};

/**
 * Calculate category breakdown from manual expenses and scheduled activities
 * @param {Array} expenses List of Expense records
 * @param {Array} tripStops List of TripStop records containing tripActivities
 */
const calculateCategoryTotals = (expenses = [], tripStops = []) => {
  const categoryTotals = {
    transport: 0,
    accommodation: 0,
    activities: 0,
    food: 0,
    other: 0,
  };

  // 1. Process manual expenses
  for (const exp of expenses) {
    const amount = roundMoney(exp.amount);
    const cat = exp.category ? exp.category.toUpperCase() : 'OTHER';

    switch (cat) {
      case 'TRANSPORT':
        categoryTotals.transport = roundMoney(categoryTotals.transport + amount);
        break;
      case 'ACCOMMODATION':
        categoryTotals.accommodation = roundMoney(categoryTotals.accommodation + amount);
        break;
      case 'ACTIVITY':
        categoryTotals.activities = roundMoney(categoryTotals.activities + amount);
        break;
      case 'FOOD':
        categoryTotals.food = roundMoney(categoryTotals.food + amount);
        break;
      case 'OTHER':
      default:
        categoryTotals.other = roundMoney(categoryTotals.other + amount);
        break;
    }
  }

  // 2. Add scheduled activities costs from trip stops
  for (const stop of tripStops) {
    if (stop.tripActivities && Array.isArray(stop.tripActivities)) {
      for (const act of stop.tripActivities) {
        const cost = roundMoney(act.cost || (act.activity ? act.activity.cost : 0) || 0);
        categoryTotals.activities = roundMoney(categoryTotals.activities + cost);
      }
    }
  }

  const totalCost = roundMoney(
    categoryTotals.transport +
      categoryTotals.accommodation +
      categoryTotals.activities +
      categoryTotals.food +
      categoryTotals.other
  );

  return {
    categoryTotals,
    totalCost,
  };
};

/**
 * Determine Budget Alert Status
 */
const getBudgetStatus = (totalCost, budget) => {
  if (budget > 0 && totalCost > budget) {
    return 'OVER_BUDGET';
  }
  const percentageUsed = budget > 0 ? (totalCost / budget) * 100 : 0;
  if (percentageUsed >= 90) {
    return 'NEAR_LIMIT';
  }
  return 'HEALTHY';
};

/**
 * Calculate Daily Cost Breakdown for every day of the trip
 */
const calculateDailyBreakdown = (startDate, endDate, expenses = [], tripStops = []) => {
  const dateList = generateTripDateList(startDate, endDate);
  const durationInDays = dateList.length;

  const dailyMap = {};
  for (const dateStr of dateList) {
    dailyMap[dateStr] = {
      expensesCost: 0,
      activitiesCost: 0,
      totalCost: 0,
    };
  }

  // Map manual expenses to dates
  for (const exp of expenses) {
    if (exp.date) {
      const expDateStr = new Date(exp.date).toISOString().split('T')[0];
      if (dailyMap[expDateStr]) {
        dailyMap[expDateStr].expensesCost = roundMoney(
          dailyMap[expDateStr].expensesCost + roundMoney(exp.amount)
        );
      }
    }
  }

  // Map scheduled activities to dates
  for (const stop of tripStops) {
    if (stop.tripActivities && Array.isArray(stop.tripActivities)) {
      for (const act of stop.tripActivities) {
        const actDate = act.date || stop.startDate;
        if (actDate) {
          const actDateStr = new Date(actDate).toISOString().split('T')[0];
          const cost = roundMoney(act.cost || (act.activity ? act.activity.cost : 0) || 0);
          if (dailyMap[actDateStr]) {
            dailyMap[actDateStr].activitiesCost = roundMoney(
              dailyMap[actDateStr].activitiesCost + cost
            );
          }
        }
      }
    }
  }

  // Compute daily totals
  let grandTotal = 0;
  for (const dateStr of dateList) {
    const item = dailyMap[dateStr];
    item.totalCost = roundMoney(item.expensesCost + item.activitiesCost);
    grandTotal = roundMoney(grandTotal + item.totalCost);
  }

  const averageDailyCost = durationInDays > 0 ? roundMoney(grandTotal / durationInDays) : 0;

  const dailyBreakdown = dateList.map((dateStr, index) => {
    const dayData = dailyMap[dateStr];
    const totalCost = dayData.totalCost;
    const isAboveAverage = totalCost > averageDailyCost;
    const diff = averageDailyCost > 0 ? totalCost - averageDailyCost : 0;
    const percentageDifference = averageDailyCost > 0 ? roundMoney((diff / averageDailyCost) * 100) : 0;

    return {
      day: index + 1,
      date: dateStr,
      expensesCost: dayData.expensesCost,
      activitiesCost: dayData.activitiesCost,
      totalCost,
      isAboveAverage,
      percentageDifference,
    };
  });

  return {
    dailyBreakdown,
    averageDailyCost,
    totalCost: grandTotal,
    durationInDays,
  };
};

/**
 * Generate Smart Rule-Based Recommendations & Insights
 */
const generateSmartInsights = (budget, totalCost, categoryTotals, dailyBreakdown, averageDailyCost, currency = 'USD') => {
  const insights = [];
  const percentageUsed = budget > 0 ? roundMoney((totalCost / budget) * 100) : 0;
  const status = getBudgetStatus(totalCost, budget);

  // Rule 1: Over Budget Alert
  if (totalCost > budget && budget > 0) {
    const overage = roundMoney(totalCost - budget);
    insights.push(`Your trip is currently ${currency} ${overage.toFixed(2)} over budget.`);
  } else if (percentageUsed >= 90 && budget > 0) {
    insights.push(`Your trip is approaching the budget limit (${percentageUsed}% used).`);
  } else if (budget > 0) {
    const remaining = roundMoney(budget - totalCost);
    insights.push(`You have ${currency} ${remaining.toFixed(2)} remaining (${100 - percentageUsed}% available).`);
  }

  // Rule 2: Daily Spike Insights (Day spending 25%+ above average)
  for (const day of dailyBreakdown) {
    if (day.isAboveAverage && day.percentageDifference >= 25 && day.totalCost > 0) {
      insights.push(
        `Day ${day.day} (${day.date}) is significantly above your average daily spending (+${day.percentageDifference}% higher).`
      );
    }
  }

  // Rule 3: High Activity Spending
  if (totalCost > 0) {
    const activityRatio = (categoryTotals.activities / totalCost) * 100;
    if (activityRatio >= 40) {
      insights.push(
        `Activity spending accounts for ${roundMoney(activityRatio)}% of your trip total. Consider replacing an expensive activity with a lower-cost alternative.`
      );
    }
  }

  // Rule 4: Accommodation Spending proportion
  if (totalCost > 0) {
    const accRatio = (categoryTotals.accommodation / totalCost) * 100;
    if (accRatio >= 50) {
      insights.push(
        `Accommodation comprises ${roundMoney(accRatio)}% of your expenses. Explore boutique or self-catering options to balance costs.`
      );
    }
  }

  if (insights.length === 0) {
    insights.push('Your trip spending is balanced and well within target thresholds.');
  }

  return {
    status,
    insights,
  };
};

/**
 * Calculate Holistic Trip Health Score (0 - 100)
 */
const calculateTripHealth = (budget, totalCost, categoryTotals, dailyBreakdown, tripStops = []) => {
  // 1. Budget Score (40% weight)
  let budgetScore = 100;
  if (budget > 0) {
    const ratio = totalCost / budget;
    if (ratio <= 0.8) {
      budgetScore = 100;
    } else if (ratio <= 1.0) {
      budgetScore = Math.max(70, Math.round(100 - ((ratio - 0.8) / 0.2) * 30));
    } else {
      const overRatio = ratio - 1.0;
      budgetScore = Math.max(0, Math.round(70 - overRatio * 100));
    }
  }

  // 2. Daily Spending Balance Score (20% weight)
  let scheduleScore = 85;
  if (dailyBreakdown.length > 0) {
    const highSpikeCount = dailyBreakdown.filter((d) => d.percentageDifference >= 40).length;
    scheduleScore = Math.max(40, 100 - highSpikeCount * 15);
  }

  // 3. Daily Spending Score (20% weight)
  let dailySpendingScore = 90;
  if (budget > 0 && dailyBreakdown.length > 0) {
    const targetDailyBudget = budget / dailyBreakdown.length;
    const overBudgetDays = dailyBreakdown.filter((d) => d.totalCost > targetDailyBudget).length;
    const overRatio = overBudgetDays / dailyBreakdown.length;
    dailySpendingScore = Math.max(30, Math.round(100 - overRatio * 60));
  }

  // 4. Activity Density Score (20% weight)
  let activityScore = 90;
  let totalActivitiesCount = 0;
  for (const stop of tripStops) {
    if (stop.tripActivities) {
      totalActivitiesCount += stop.tripActivities.length;
    }
  }
  const avgActivitiesPerDay = dailyBreakdown.length > 0 ? totalActivitiesCount / dailyBreakdown.length : 0;
  if (avgActivitiesPerDay > 4) {
    activityScore = 65; // Overbooked
  } else if (avgActivitiesPerDay >= 1 && avgActivitiesPerDay <= 3) {
    activityScore = 95; // Ideal density
  } else if (avgActivitiesPerDay < 1 && totalActivitiesCount > 0) {
    activityScore = 80;
  }

  // Composite Health Score
  const score = Math.round(
    budgetScore * 0.4 + scheduleScore * 0.2 + dailySpendingScore * 0.2 + activityScore * 0.2
  );

  const recommendations = [];
  if (budgetScore < 70) {
    recommendations.push('Budget health is critical. Review expense line-items to reduce overage.');
  }
  if (scheduleScore < 70) {
    recommendations.push('Daily spending varies wildly across your itinerary. Consider redistributing paid activities.');
  }
  if (activityScore < 75) {
    recommendations.push('High activity density detected. Add rest days or buffer time to prevent traveler fatigue.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Your trip itinerary and budget health are in excellent condition!');
  }

  return {
    score,
    budgetScore,
    scheduleScore,
    dailySpendingScore,
    activityScore,
    recommendations,
  };
};

module.exports = {
  roundMoney,
  calculateDurationInDays,
  generateTripDateList,
  calculateCategoryTotals,
  getBudgetStatus,
  calculateDailyBreakdown,
  generateSmartInsights,
  calculateTripHealth,
};
