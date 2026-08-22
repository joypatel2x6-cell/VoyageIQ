const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { roundMoney, generateTripDateList } = require('../utils/budget.utils');

/**
 * Utility helper to fetch trip and verify user access permissions
 * Uses eager relational loading to prevent N+1 queries.
 */
const getTripWithFullRelations = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      tripStops: {
        orderBy: { orderIndex: 'asc' },
        include: {
          city: true,
          tripActivities: {
            orderBy: { orderIndex: 'asc' },
            include: {
              activity: {
                include: {
                  city: true,
                },
              },
            },
          },
        },
      },
      expenses: {
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  // Authorization check
  if (trip.userId !== userId && !trip.isPublic) {
    throw new ApiError(403, 'You do not have permission to view calendar data for this private trip');
  }

  return trip;
};

/**
 * GET /api/v1/trips/:tripId/calendar
 * Comprehensive Calendar Overview (Trip dates, stops, cities, activities, activity times, costs, daily totals)
 */
const getTripCalendar = async (tripId, userId) => {
  const trip = await getTripWithFullRelations(tripId, userId);

  const dateList = generateTripDateList(trip.startDate, trip.endDate);

  const calendarDays = dateList.map((dateStr, index) => {
    const dayNumber = index + 1;

    // 1. Find overlapping stop for this date
    const stopForDay = trip.tripStops.find((stop) => {
      const sStart = new Date(stop.startDate).toISOString().split('T')[0];
      const sEnd = new Date(stop.endDate).toISOString().split('T')[0];
      return dateStr >= sStart && dateStr <= sEnd;
    });

    // 2. Find activities scheduled for this date
    const activitiesForDay = [];
    for (const stop of trip.tripStops) {
      if (stop.tripActivities) {
        for (const act of stop.tripActivities) {
          const actDateStr = new Date(act.date || stop.startDate).toISOString().split('T')[0];
          if (actDateStr === dateStr) {
            activitiesForDay.push({
              id: act.id,
              activityId: act.activityId,
              name: act.activity ? act.activity.name : 'Unspecified Activity',
              category: act.activity ? act.activity.category : 'OTHER',
              startTime: act.startTime,
              duration: act.duration || (act.activity ? act.activity.duration : null),
              cost: roundMoney(act.cost || (act.activity ? act.activity.cost : 0) || 0),
              image: act.activity ? act.activity.image : null,
              notes: act.notes,
              orderIndex: act.orderIndex,
              city: act.activity && act.activity.city ? {
                id: act.activity.city.id,
                name: act.activity.city.name,
                country: act.activity.city.country,
              } : null,
            });
          }
        }
      }
    }

    // 3. Find manual expenses logged on this date
    const expensesForDay = trip.expenses
      .filter((exp) => exp.date && new Date(exp.date).toISOString().split('T')[0] === dateStr)
      .map((exp) => ({
        id: exp.id,
        category: exp.category,
        amount: roundMoney(exp.amount),
        currency: exp.currency,
        description: exp.description,
      }));

    // 4. Calculate daily total cost
    const activitiesCost = activitiesForDay.reduce((sum, a) => sum + a.cost, 0);
    const expensesCost = expensesForDay.reduce((sum, e) => sum + e.amount, 0);
    const dailyTotalCost = roundMoney(activitiesCost + expensesCost);

    return {
      day: dayNumber,
      date: dateStr,
      city: stopForDay ? stopForDay.city : null,
      stopId: stopForDay ? stopForDay.id : null,
      activities: activitiesForDay,
      expenses: expensesForDay,
      dailyTotalCost,
    };
  });

  return {
    tripId: trip.id,
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    durationInDays: dateList.length,
    currency: trip.currency,
    stops: trip.tripStops.map((s) => ({
      id: s.id,
      cityId: s.cityId,
      city: s.city,
      startDate: s.startDate,
      endDate: s.endDate,
      orderIndex: s.orderIndex,
      notes: s.notes,
    })),
    calendarDays,
  };
};

/**
 * GET /api/v1/trips/:tripId/timeline
 * Chronologically Grouped Timeline for Itinerary Display
 */
const getTripTimeline = async (tripId, userId) => {
  const calendarData = await getTripCalendar(tripId, userId);

  const timeline = calendarData.calendarDays.map((day) => ({
    day: day.day,
    date: day.date,
    city: day.city
      ? {
          id: day.city.id,
          name: day.city.name,
          country: day.city.country,
          region: day.city.region,
          image: day.city.image,
        }
      : null,
    stopId: day.stopId,
    activities: day.activities,
    expenses: day.expenses,
    dailyTotalCost: day.dailyTotalCost,
  }));

  return {
    tripId: calendarData.tripId,
    name: calendarData.name,
    startDate: calendarData.startDate,
    endDate: calendarData.endDate,
    durationInDays: calendarData.durationInDays,
    currency: calendarData.currency,
    timeline,
  };
};

/**
 * GET /api/v1/trips/:tripId/days/:date
 * Single Day Itinerary & Cost Breakdown
 */
const getSingleDayDetail = async (tripId, rawDateStr, userId) => {
  const trip = await getTripWithFullRelations(tripId, userId);

  const targetDateStr = new Date(rawDateStr).toISOString().split('T')[0];
  const startDateStr = new Date(trip.startDate).toISOString().split('T')[0];
  const endDateStr = new Date(trip.endDate).toISOString().split('T')[0];

  if (targetDateStr < startDateStr || targetDateStr > endDateStr) {
    throw new ApiError(
      400,
      `Requested date (${targetDateStr}) falls outside trip date bounds (${startDateStr} to ${endDateStr})`
    );
  }

  const calendarData = await getTripCalendar(tripId, userId);
  const dayDetail = calendarData.calendarDays.find((d) => d.date === targetDateStr);

  if (!dayDetail) {
    throw new ApiError(404, 'Day detail not found');
  }

  return {
    tripId: trip.id,
    tripName: trip.name,
    currency: trip.currency,
    ...dayDetail,
  };
};

module.exports = {
  getTripWithFullRelations,
  getTripCalendar,
  getTripTimeline,
  getSingleDayDetail,
};
