const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

/**
 * Determine automatic status based on trip start and end dates
 * @param {Date|string} startDate
 * @param {Date|string} endDate
 * @param {string} [explicitStatus]
 * @returns {string} Status enum value: 'DRAFT' | 'UPCOMING' | 'ONGOING' | 'COMPLETED'
 */
const calculateTripStatus = (startDate, endDate, explicitStatus) => {
  if (explicitStatus === 'DRAFT') {
    return 'DRAFT';
  }

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Normalize dates to midnight for date-only comparison
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startZero = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endZero = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59).getTime();

  if (startZero > nowZero) {
    return 'UPCOMING';
  }
  if (endZero < nowZero) {
    return 'COMPLETED';
  }
  return 'ONGOING';
};

/**
 * Create a new Trip record
 * @param {string} userId Owner User ID
 * @param {Object} tripData Trip input fields
 */
const createTrip = async (userId, tripData) => {
  const startDate = new Date(tripData.startDate);
  const endDate = new Date(tripData.endDate);

  if (endDate < startDate) {
    throw new ApiError(400, 'End date cannot be before start date');
  }

  const status = calculateTripStatus(startDate, endDate, tripData.status);

  const newTrip = await prisma.trip.create({
    data: {
      userId,
      name: tripData.name,
      description: tripData.description || null,
      startDate,
      endDate,
      budget: tripData.budget,
      currency: tripData.currency || 'USD',
      travelers: tripData.travelers || 1,
      travelStyle: tripData.travelStyle || null,
      coverImage: tripData.coverImage || null,
      isPublic: tripData.isPublic ?? false,
      status,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
  });

  return newTrip;
};

/**
 * Fetch paginated list of trips belonging to the authenticated user with filters
 * @param {string} userId User ID
 * @param {Object} query Query filters
 */
const getUserTrips = async (userId, query) => {
  const {
    status,
    search,
    destination,
    startDate,
    endDate,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 10,
  } = query;

  const where = {
    userId,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (destination) {
    where.tripStops = {
      some: {
        city: {
          OR: [
            { name: { contains: destination, mode: 'insensitive' } },
            { country: { contains: destination, mode: 'insensitive' } },
          ],
        },
      },
    };
  }

  if (startDate) {
    where.startDate = { gte: new Date(startDate) };
  }

  if (endDate) {
    where.endDate = { lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;

  const [total, trips] = await Promise.all([
    prisma.trip.count({ where }),
    prisma.trip.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
      include: {
        tripStops: {
          orderBy: { orderIndex: 'asc' },
          include: {
            city: true,
          },
        },
        expenses: {
          select: {
            amount: true,
            currency: true,
          },
        },
      },
    }),
  ]);

  return {
    trips,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get detailed Trip breakdown by ID with owner summary and budget calculations
 * @param {string} tripId Trip ID
 * @param {string} currentUserId Authenticated user ID requesting detail
 */
const getTripDetail = async (tripId, currentUserId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
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
    throw new ApiError(404, 'Trip not found');
  }

  // Authorization check: must be trip owner OR trip must be public
  if (trip.userId !== currentUserId && !trip.isPublic) {
    throw new ApiError(403, 'You do not have permission to view this private trip');
  }

  // Calculate Budget Summary
  const totalBudget = parseFloat(trip.budget.toString());
  const expensesByCategory = {
    TRANSPORT: 0,
    ACCOMMODATION: 0,
    ACTIVITY: 0,
    FOOD: 0,
    OTHER: 0,
  };

  let totalExpenses = 0;
  for (const exp of trip.expenses) {
    const amount = parseFloat(exp.amount.toString());
    totalExpenses += amount;
    if (expensesByCategory[exp.category] !== undefined) {
      expensesByCategory[exp.category] += amount;
    } else {
      expensesByCategory.OTHER += amount;
    }
  }

  const remainingBudget = totalBudget - totalExpenses;

  const budgetSummary = {
    totalBudget,
    totalExpenses,
    remainingBudget,
    currency: trip.currency,
    expensesByCategory,
  };

  return {
    trip: {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget,
      currency: trip.currency,
      travelers: trip.travelers,
      travelStyle: trip.travelStyle,
      coverImage: trip.coverImage,
      isPublic: trip.isPublic,
      shareToken: trip.shareToken,
      status: trip.status,
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    },
    owner: trip.user,
    tripStops: trip.tripStops,
    expenses: trip.expenses,
    budgetSummary,
  };
};

/**
 * Update existing Trip
 * @param {string} tripId Trip ID
 * @param {string} userId Requesting User ID
 * @param {Object} updateData Fields to update
 */
const updateTrip = async (tripId, userId, updateData) => {
  const existingTrip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      tripStops: true,
    },
  });

  if (!existingTrip) {
    throw new ApiError(404, 'Trip not found');
  }

  if (existingTrip.userId !== userId) {
    throw new ApiError(403, 'Only the trip owner can update this trip');
  }

  const newStartDate = updateData.startDate ? new Date(updateData.startDate) : existingTrip.startDate;
  const newEndDate = updateData.endDate ? new Date(updateData.endDate) : existingTrip.endDate;

  if (newEndDate < newStartDate) {
    throw new ApiError(400, 'End date cannot be before start date');
  }

  // Validate date changes against existing trip stops
  if (updateData.startDate || updateData.endDate) {
    for (const stop of existingTrip.tripStops) {
      const stopStart = new Date(stop.startDate);
      const stopEnd = new Date(stop.endDate);

      if (stopStart < newStartDate || stopEnd > newEndDate) {
        throw new ApiError(
          400,
          `Trip dates (${newStartDate.toISOString().split('T')[0]} to ${
            newEndDate.toISOString().split('T')[0]
          }) conflict with existing trip stop dates (${stopStart.toISOString().split('T')[0]} to ${
            stopEnd.toISOString().split('T')[0]
          })`
        );
      }
    }
  }

  // Automatically recalculate status if dates changed and explicit status not provided
  const status = calculateTripStatus(
    newStartDate,
    newEndDate,
    updateData.status || existingTrip.status
  );

  const payload = {
    ...(updateData.name && { name: updateData.name }),
    ...(updateData.description !== undefined && { description: updateData.description }),
    ...(updateData.startDate && { startDate: newStartDate }),
    ...(updateData.endDate && { endDate: newEndDate }),
    ...(updateData.budget !== undefined && { budget: updateData.budget }),
    ...(updateData.currency && { currency: updateData.currency }),
    ...(updateData.travelers !== undefined && { travelers: updateData.travelers }),
    ...(updateData.travelStyle !== undefined && { travelStyle: updateData.travelStyle }),
    ...(updateData.coverImage !== undefined && { coverImage: updateData.coverImage }),
    ...(updateData.isPublic !== undefined && { isPublic: updateData.isPublic }),
    status,
  };

  const updatedTrip = await prisma.trip.update({
    where: { id: tripId },
    data: payload,
  });

  return updatedTrip;
};

/**
 * Delete Trip by ID
 * @param {string} tripId Trip ID
 * @param {string} userId Requesting User ID
 */
const deleteTrip = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  if (trip.userId !== userId) {
    throw new ApiError(403, 'Only the trip owner can delete this trip');
  }

  // Prisma cascade deletes tripStops, tripActivities, and expenses
  await prisma.trip.delete({
    where: { id: tripId },
  });

  return {
    success: true,
    message: 'Trip deleted successfully',
  };
};

/**
 * Duplicate an existing trip for the authenticated user using database transactions
 * @param {string} sourceTripId ID of the trip to duplicate
 * @param {string} userId Authenticated User ID
 */
const duplicateTrip = async (sourceTripId, userId) => {
  const sourceTrip = await prisma.trip.findUnique({
    where: { id: sourceTripId },
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
    throw new ApiError(404, 'Source trip not found');
  }

  // Authorization check: if private, must belong to requesting user
  if (sourceTrip.userId !== userId && !sourceTrip.isPublic) {
    throw new ApiError(403, 'You do not have permission to duplicate this private trip');
  }

  // Execute atomic duplication in database transaction
  const duplicatedTrip = await prisma.$transaction(async (tx) => {
    // 1. Create new Trip record
    const newTrip = await tx.trip.create({
      data: {
        userId,
        name: `${sourceTrip.name} (Copy)`,
        description: sourceTrip.description,
        startDate: sourceTrip.startDate,
        endDate: sourceTrip.endDate,
        budget: sourceTrip.budget,
        currency: sourceTrip.currency,
        travelers: sourceTrip.travelers,
        travelStyle: sourceTrip.travelStyle,
        coverImage: sourceTrip.coverImage,
        isPublic: false, // Default duplicated trips to private
        shareToken: null, // Reset public share token
        status: sourceTrip.status,
      },
    });

    // 2. Duplicate TripStops & TripActivities
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

    // 3. Duplicate Expenses
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

  return duplicatedTrip;
};

module.exports = {
  calculateTripStatus,
  createTrip,
  getUserTrips,
  getTripDetail,
  updateTrip,
  deleteTrip,
  duplicateTrip,
};
