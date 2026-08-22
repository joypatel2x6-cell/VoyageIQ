const crypto = require('crypto');
const prisma = require('../config/prisma');
const config = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * Enable public sharing for a trip and generate a cryptographically secure shareToken
 * @param {string} tripId Trip ID to share
 * @param {string} userId Requesting User ID (must be trip owner)
 * @returns {Promise<{ shareToken: string, publicUrl: string, isPublic: boolean }>}
 */
const enableShare = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  if (trip.userId !== userId) {
    throw new ApiError(403, 'Only the trip owner can enable public sharing for this trip');
  }

  // Generate cryptographically secure 64-character hex token if not already assigned
  const shareToken = trip.shareToken || crypto.randomBytes(32).toString('hex');

  const updatedTrip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      isPublic: true,
      shareToken,
    },
  });

  const baseUrl = config.frontendUrl || 'http://localhost:3000';
  const publicUrl = `${baseUrl.replace(/\/$/, '')}/public/trips/${shareToken}`;

  // Create event notification for trip owner
  const { createNotification } = require('./notification.service');
  await createNotification(userId, {
    title: 'Trip Shared',
    message: `Your trip "${updatedTrip.name}" is now public and can be shared via link.`,
    type: 'TRIP_SHARED',
  });

  return {
    shareToken: updatedTrip.shareToken,
    publicUrl,
    isPublic: updatedTrip.isPublic,
  };
};

/**
 * Disable public sharing for a trip
 * @param {string} tripId Trip ID to unshare
 * @param {string} userId Requesting User ID (must be trip owner)
 * @returns {Promise<{ isPublic: boolean, message: string }>}
 */
const disableShare = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  if (trip.userId !== userId) {
    throw new ApiError(403, 'Only the trip owner can disable public sharing for this trip');
  }

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      isPublic: false,
      shareToken: null,
    },
  });

  return {
    isPublic: false,
    message: 'Public trip sharing disabled successfully',
  };
};

/**
 * Retrieve public trip itinerary details by share token
 * Excludes all private user information and sensitive database internals
 * @param {string} shareToken Public share token
 */
const getPublicTrip = async (shareToken) => {
  const trip = await prisma.trip.findFirst({
    where: {
      shareToken,
      isPublic: true,
    },
    include: {
      tripStops: {
        orderBy: { orderIndex: 'asc' },
        include: {
          city: true,
          tripActivities: {
            orderBy: { orderIndex: 'asc' },
            include: {
              activity: true,
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
    throw new ApiError(404, 'Public trip not found or sharing has been disabled');
  }

  // Calculate Duration in days
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const duration = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  // Extract unique cities list
  const cityMap = new Map();
  for (const stop of trip.tripStops) {
    if (stop.city && !cityMap.has(stop.city.id)) {
      cityMap.set(stop.city.id, {
        id: stop.city.id,
        name: stop.city.name,
        country: stop.city.country,
        region: stop.city.region,
        description: stop.city.description,
        image: stop.city.image,
      });
    }
  }
  const cities = Array.from(cityMap.values());

  // Aggregate activities across all trip stops
  const activities = [];
  for (const stop of trip.tripStops) {
    for (const ta of stop.tripActivities) {
      activities.push({
        id: ta.id,
        date: ta.date,
        startTime: ta.startTime,
        duration: ta.duration || ta.activity?.duration,
        cost: ta.cost ? parseFloat(ta.cost.toString()) : ta.activity?.cost ? parseFloat(ta.activity.cost.toString()) : 0,
        notes: ta.notes,
        orderIndex: ta.orderIndex,
        activity: ta.activity
          ? {
              id: ta.activity.id,
              name: ta.activity.name,
              category: ta.activity.category,
              description: ta.activity.description,
              image: ta.activity.image,
              rating: ta.activity.rating,
              recommendedTime: ta.activity.recommendedTime,
            }
          : null,
        cityName: stop.city?.name || null,
      });
    }
  }

  // Calculate Budget & Expenses Breakdown
  const totalBudget = parseFloat(trip.budget.toString());
  const expensesByCategory = {
    TRANSPORT: 0,
    ACCOMMODATION: 0,
    ACTIVITY: 0,
    FOOD: 0,
    OTHER: 0,
  };

  let totalExpenses = 0;
  const expensesList = [];
  for (const exp of trip.expenses) {
    const amount = parseFloat(exp.amount.toString());
    totalExpenses += amount;
    if (expensesByCategory[exp.category] !== undefined) {
      expensesByCategory[exp.category] += amount;
    } else {
      expensesByCategory.OTHER += amount;
    }
    expensesList.push({
      id: exp.id,
      category: exp.category,
      amount,
      currency: exp.currency,
      description: exp.description,
      date: exp.date,
    });
  }

  const remainingBudget = totalBudget - totalExpenses;

  const budgetBreakdown = {
    totalBudget,
    totalExpenses,
    remainingBudget,
    currency: trip.currency,
    expensesByCategory,
    expenses: expensesList,
  };

  // Structured public response without private user info (email, password, phone, userId, bio, user object)
  return {
    shareToken: trip.shareToken,
    name: trip.name,
    description: trip.description,
    coverImage: trip.coverImage,
    startDate: trip.startDate,
    endDate: trip.endDate,
    duration,
    travelers: trip.travelers,
    travelStyle: trip.travelStyle,
    status: trip.status,
    cities,
    activities,
    budget: totalBudget,
    currency: trip.currency,
    budgetBreakdown,
    stops: trip.tripStops.map((stop) => ({
      id: stop.id,
      cityId: stop.cityId,
      cityName: stop.city?.name,
      country: stop.city?.country,
      startDate: stop.startDate,
      endDate: stop.endDate,
      orderIndex: stop.orderIndex,
      notes: stop.notes,
      activitiesCount: stop.tripActivities.length,
    })),
  };
};

/**
 * Copy a public trip into the authenticated user's account using database transactions
 * @param {string} shareToken Public share token
 * @param {string} userId Authenticated user ID creating the copy
 */
const copyPublicTrip = async (shareToken, userId) => {
  const sourceTrip = await prisma.trip.findFirst({
    where: {
      shareToken,
      isPublic: true,
    },
    include: {
      tripStops: {
        include: {
          tripActivities: true,
        },
      },
      expenses: true,
    },
  });

  if (!sourceTrip) {
    throw new ApiError(404, 'Public trip not found or sharing has been disabled');
  }

  // Perform atomic transaction to duplicate trip, stops, activities & expenses with new IDs
  const copiedTrip = await prisma.$transaction(async (tx) => {
    // 1. Create new Trip record owned by requesting user
    const newTrip = await tx.trip.create({
      data: {
        userId,
        name: sourceTrip.name.endsWith('(Copy)') ? sourceTrip.name : `${sourceTrip.name} (Copy)`,
        description: sourceTrip.description,
        startDate: sourceTrip.startDate,
        endDate: sourceTrip.endDate,
        budget: sourceTrip.budget,
        currency: sourceTrip.currency,
        travelers: sourceTrip.travelers,
        travelStyle: sourceTrip.travelStyle,
        coverImage: sourceTrip.coverImage,
        isPublic: false, // Reset sharing status
        shareToken: null, // Reset share token
        status: sourceTrip.status,
      },
    });

    // 2. Copy TripStops & TripActivities with fresh UUIDs
    for (const stop of sourceTrip.tripStops) {
      const newStop = await tx.tripStop.create({
        data: {
          tripId: newTrip.id,
          cityId: stop.cityId,
          startDate: stop.startDate,
          endDate: stop.endDate,
          orderIndex: stop.orderIndex,
          notes: stop.notes,
        },
      });

      for (const act of stop.tripActivities) {
        await tx.tripActivity.create({
          data: {
            tripStopId: newStop.id,
            activityId: act.activityId,
            date: act.date,
            startTime: act.startTime,
            duration: act.duration,
            cost: act.cost,
            notes: act.notes,
            orderIndex: act.orderIndex,
          },
        });
      }
    }

    // 3. Copy Expenses with fresh UUIDs
    for (const exp of sourceTrip.expenses) {
      await tx.expense.create({
        data: {
          tripId: newTrip.id,
          category: exp.category,
          amount: exp.amount,
          currency: exp.currency,
          description: exp.description,
          date: exp.date,
        },
      });
    }

    return newTrip;
  });

  // Notify original trip owner if copied by another user
  if (sourceTrip.userId !== userId) {
    const { createNotification } = require('./notification.service');
    await createNotification(sourceTrip.userId, {
      title: 'Trip Copied',
      message: `A user copied your public trip "${sourceTrip.name}".`,
      type: 'TRIP_COPIED',
    });
  }

  return copiedTrip;
};

module.exports = {
  enableShare,
  disableShare,
  getPublicTrip,
  copyPublicTrip,
};
