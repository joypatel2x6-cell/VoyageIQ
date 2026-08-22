const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

/**
 * Utility helper to check trip existence and owner authorization
 * @param {string} tripId Trip ID
 * @param {string} userId Requesting User ID
 */
const checkTripOwnership = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  if (trip.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to modify stops for this trip');
  }

  return trip;
};

/**
 * Helper to calculate stay duration in days
 */
const calculateDurationInDays = (startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

/**
 * Helper to calculate estimated cost for a trip stop
 */
const calculateStopEstimatedCost = (stop, durationDays) => {
  let activityCostsSum = 0;
  if (stop.tripActivities && Array.isArray(stop.tripActivities)) {
    for (const act of stop.tripActivities) {
      if (act.cost) {
        activityCostsSum += parseFloat(act.cost.toString());
      } else if (act.activity && act.activity.cost) {
        activityCostsSum += parseFloat(act.activity.cost.toString());
      }
    }
  }

  let cityDailyCostSum = 0;
  if (stop.city && stop.city.averageDailyCost) {
    cityDailyCostSum = parseFloat(stop.city.averageDailyCost.toString()) * durationDays;
  }

  return {
    activitiesCost: activityCostsSum,
    estimatedCityCost: cityDailyCostSum,
    totalEstimatedCost: activityCostsSum + cityDailyCostSum,
  };
};

/**
 * Add a new stop to a trip
 * @param {string} tripId Trip ID
 * @param {string} userId Owner User ID
 * @param {Object} stopData Input data (cityId, startDate, endDate, notes)
 */
const addStop = async (tripId, userId, stopData) => {
  const trip = await checkTripOwnership(tripId, userId);

  // Check city existence
  const city = await prisma.city.findUnique({
    where: { id: stopData.cityId },
  });

  if (!city) {
    throw new ApiError(404, 'City not found');
  }

  const startDate = new Date(stopData.startDate);
  const endDate = new Date(stopData.endDate);

  if (endDate < startDate) {
    throw new ApiError(400, 'End date cannot be before start date');
  }

  // Validate dates fall inside trip dates
  const tripStart = new Date(trip.startDate);
  const tripEnd = new Date(trip.endDate);

  if (startDate < tripStart || endDate > tripEnd) {
    throw new ApiError(
      400,
      `Stop dates (${startDate.toISOString().split('T')[0]} to ${
        endDate.toISOString().split('T')[0]
      }) must fall inside the trip date range (${tripStart.toISOString().split('T')[0]} to ${
        tripEnd.toISOString().split('T')[0]
      })`
    );
  }

  // Check for date overlaps with existing stops on the same trip
  const existingStops = await prisma.tripStop.findMany({
    where: { tripId },
  });

  for (const s of existingStops) {
    const sStart = new Date(s.startDate);
    const sEnd = new Date(s.endDate);

    if (startDate < sEnd && endDate > sStart) {
      throw new ApiError(
        400,
        `Stop dates (${startDate.toISOString().split('T')[0]} to ${
          endDate.toISOString().split('T')[0]
        }) overlap with an existing stop (${sStart.toISOString().split('T')[0]} to ${
          sEnd.toISOString().split('T')[0]
        })`
      );
    }
  }

  // Automatically calculate next orderIndex
  const maxOrderIndex = existingStops.reduce((max, s) => Math.max(max, s.orderIndex), 0);
  const orderIndex = maxOrderIndex + 1;

  const newStop = await prisma.tripStop.create({
    data: {
      tripId,
      cityId: stopData.cityId,
      startDate,
      endDate,
      notes: stopData.notes || null,
      orderIndex,
    },
    include: {
      city: true,
      tripActivities: {
        include: {
          activity: true,
        },
      },
    },
  });

  const durationDays = calculateDurationInDays(newStop.startDate, newStop.endDate);
  const costBreakdown = calculateStopEstimatedCost(newStop, durationDays);

  return {
    ...newStop,
    durationDays,
    estimatedCost: costBreakdown,
  };
};

/**
 * Get all stops for a trip
 * @param {string} tripId Trip ID
 * @param {string} userId Requesting User ID
 */
const getTripStops = async (tripId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  // Authorization check
  if (trip.userId !== userId && !trip.isPublic) {
    throw new ApiError(403, 'You do not have permission to view stops for this private trip');
  }

  const stops = await prisma.tripStop.findMany({
    where: { tripId },
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
  });

  return stops.map((stop) => {
    const durationDays = calculateDurationInDays(stop.startDate, stop.endDate);
    const costBreakdown = calculateStopEstimatedCost(stop, durationDays);

    return {
      id: stop.id,
      tripId: stop.tripId,
      cityId: stop.cityId,
      city: stop.city,
      startDate: stop.startDate,
      endDate: stop.endDate,
      durationDays,
      notes: stop.notes,
      orderIndex: stop.orderIndex,
      tripActivities: stop.tripActivities,
      estimatedCost: costBreakdown,
      createdAt: stop.createdAt,
      updatedAt: stop.updatedAt,
    };
  });
};

/**
 * Update a trip stop
 * @param {string} tripId Trip ID
 * @param {string} stopId Stop ID
 * @param {string} userId Owner User ID
 * @param {Object} updateData Update fields
 */
const updateStop = async (tripId, stopId, userId, updateData) => {
  const trip = await checkTripOwnership(tripId, userId);

  const existingStop = await prisma.tripStop.findFirst({
    where: { id: stopId, tripId },
  });

  if (!existingStop) {
    throw new ApiError(404, 'Trip stop not found');
  }

  const newStartDate = updateData.startDate ? new Date(updateData.startDate) : existingStop.startDate;
  const newEndDate = updateData.endDate ? new Date(updateData.endDate) : existingStop.endDate;

  if (newEndDate < newStartDate) {
    throw new ApiError(400, 'End date cannot be before start date');
  }

  // Validate dates fall inside trip range
  const tripStart = new Date(trip.startDate);
  const tripEnd = new Date(trip.endDate);

  if (newStartDate < tripStart || newEndDate > tripEnd) {
    throw new ApiError(
      400,
      `Stop dates (${newStartDate.toISOString().split('T')[0]} to ${
        newEndDate.toISOString().split('T')[0]
      }) must fall inside the trip date range (${tripStart.toISOString().split('T')[0]} to ${
        tripEnd.toISOString().split('T')[0]
      })`
    );
  }

  // Check overlap with OTHER stops on the same trip
  const otherStops = await prisma.tripStop.findMany({
    where: {
      tripId,
      id: { not: stopId },
    },
  });

  for (const s of otherStops) {
    const sStart = new Date(s.startDate);
    const sEnd = new Date(s.endDate);

    if (newStartDate < sEnd && newEndDate > sStart) {
      throw new ApiError(
        400,
        `Stop dates (${newStartDate.toISOString().split('T')[0]} to ${
          newEndDate.toISOString().split('T')[0]
        }) overlap with another stop in this trip (${sStart.toISOString().split('T')[0]} to ${
          sEnd.toISOString().split('T')[0]
        })`
      );
    }
  }

  const updatedStop = await prisma.tripStop.update({
    where: { id: stopId },
    data: {
      ...(updateData.startDate && { startDate: newStartDate }),
      ...(updateData.endDate && { endDate: newEndDate }),
      ...(updateData.notes !== undefined && { notes: updateData.notes }),
      ...(updateData.orderIndex !== undefined && { orderIndex: updateData.orderIndex }),
    },
    include: {
      city: true,
      tripActivities: {
        include: {
          activity: true,
        },
      },
    },
  });

  const durationDays = calculateDurationInDays(updatedStop.startDate, updatedStop.endDate);
  const costBreakdown = calculateStopEstimatedCost(updatedStop, durationDays);

  return {
    ...updatedStop,
    durationDays,
    estimatedCost: costBreakdown,
  };
};

/**
 * Delete a trip stop by ID (deletes associated tripActivities without deleting global City)
 * @param {string} tripId Trip ID
 * @param {string} stopId Stop ID
 * @param {string} userId Owner User ID
 */
const deleteStop = async (tripId, stopId, userId) => {
  await checkTripOwnership(tripId, userId);

  const existingStop = await prisma.tripStop.findFirst({
    where: { id: stopId, tripId },
  });

  if (!existingStop) {
    throw new ApiError(404, 'Trip stop not found');
  }

  // Prisma onDelete: Cascade deletes associated TripActivities safely
  await prisma.tripStop.delete({
    where: { id: stopId },
  });

  return {
    success: true,
    message: 'Trip stop deleted successfully',
  };
};

/**
 * Reorder trip stops using a database transaction
 * @param {string} tripId Trip ID
 * @param {string} userId Owner User ID
 * @param {Array<string>} stopIds Array of ordered stop IDs
 */
const reorderStops = async (tripId, userId, stopIds) => {
  await checkTripOwnership(tripId, userId);

  const existingStops = await prisma.tripStop.findMany({
    where: { tripId },
  });

  const existingIds = new Set(existingStops.map((s) => s.id));

  // Verify all provided stopIds belong to this trip
  for (const id of stopIds) {
    if (!existingIds.has(id)) {
      throw new ApiError(400, `Stop ID "${id}" does not belong to this trip`);
    }
  }

  if (stopIds.length !== existingStops.length) {
    throw new ApiError(400, 'Reorder list must contain all stop IDs for this trip');
  }

  // Execute database transaction to atomically update orderIndex values
  await prisma.$transaction(
    stopIds.map((id, index) =>
      prisma.tripStop.update({
        where: { id },
        data: { orderIndex: index + 1 },
      })
    )
  );

  const reorderedStops = await getTripStops(tripId, userId);

  return reorderedStops;
};

module.exports = {
  checkTripOwnership,
  addStop,
  getTripStops,
  updateStop,
  deleteStop,
  reorderStops,
};
