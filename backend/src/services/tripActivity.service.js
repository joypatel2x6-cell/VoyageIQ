const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

/**
 * Utility helper to check trip and stop existence and user authorization
 * @param {string} tripId Trip ID
 * @param {string} stopId Stop ID
 * @param {string} userId Requesting User ID
 */
const checkStopOwnership = async (tripId, stopId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  if (trip.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to manage activities for this trip');
  }

  const stop = await prisma.tripStop.findFirst({
    where: { id: stopId, tripId },
  });

  if (!stop) {
    throw new ApiError(404, 'Trip stop not found');
  }

  return { trip, stop };
};

/**
 * Helper to convert "HH:MM" string to minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map((num) => parseInt(num, 10));
  return hours * 60 + minutes;
};

/**
 * Check for scheduling time overlaps between activities on the same date
 */
const checkSchedulingConflict = (existingActivities, targetDate, startTimeStr, durationMin, ignoreId = null) => {
  if (!targetDate || !startTimeStr) return false;

  const targetStartMin = timeToMinutes(startTimeStr);
  if (targetStartMin === null) return false;
  const targetEndMin = targetStartMin + (durationMin || 60);

  const targetDateStr = new Date(targetDate).toISOString().split('T')[0];

  for (const act of existingActivities) {
    if (ignoreId && act.id === ignoreId) continue;
    if (!act.date || !act.startTime) continue;

    const actDateStr = new Date(act.date).toISOString().split('T')[0];
    if (actDateStr === targetDateStr) {
      const actStartMin = timeToMinutes(act.startTime);
      if (actStartMin === null) continue;
      const actDuration = act.duration || (act.activity ? act.activity.duration : 60) || 60;
      const actEndMin = actStartMin + actDuration;

      // Overlap condition
      if (targetStartMin < actEndMin && targetEndMin > actStartMin) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Add an Activity to a Trip Stop
 * @param {string} tripId Trip ID
 * @param {string} stopId Stop ID
 * @param {string} userId Owner User ID
 * @param {Object} payload Activity schedule fields
 */
const addTripActivity = async (tripId, stopId, userId, payload) => {
  const { trip, stop } = await checkStopOwnership(tripId, stopId, userId);

  // Check activity existence
  const activity = await prisma.activity.findUnique({
    where: { id: payload.activityId },
    include: { city: true },
  });

  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  const scheduledDate = payload.date ? new Date(payload.date) : new Date(stop.startDate);
  const stopStart = new Date(stop.startDate);
  const stopEnd = new Date(stop.endDate);

  // Validate date is within stop and trip dates
  if (scheduledDate < stopStart || scheduledDate > stopEnd) {
    throw new ApiError(
      400,
      `Activity date (${scheduledDate.toISOString().split('T')[0]}) must fall within stop dates (${
        stopStart.toISOString().split('T')[0]
      } to ${stopEnd.toISOString().split('T')[0]})`
    );
  }

  // Cost and duration fallbacks
  const duration = payload.duration !== undefined ? payload.duration : activity.duration || 60;
  const cost = payload.cost !== undefined ? payload.cost : activity.cost || 0;

  if (cost < 0) {
    throw new ApiError(400, 'Cost cannot be negative');
  }
  if (duration <= 0) {
    throw new ApiError(400, 'Duration must be a positive integer in minutes');
  }

  // Check for scheduling conflicts
  const existingActivities = await prisma.tripActivity.findMany({
    where: { tripStopId: stopId },
    include: { activity: true },
  });

  if (payload.startTime && checkSchedulingConflict(existingActivities, scheduledDate, payload.startTime, duration)) {
    throw new ApiError(
      400,
      'Scheduling conflict detected: another activity is already scheduled at this date and time'
    );
  }

  // Calculate orderIndex
  const maxOrderIndex = existingActivities.reduce((max, a) => Math.max(max, a.orderIndex), 0);
  const orderIndex = maxOrderIndex + 1;

  const newTripActivity = await prisma.tripActivity.create({
    data: {
      tripStopId: stopId,
      activityId: payload.activityId,
      date: scheduledDate,
      startTime: payload.startTime || null,
      duration,
      cost,
      notes: payload.notes || null,
      orderIndex,
    },
    include: {
      activity: {
        include: {
          city: true,
        },
      },
    },
  });

  return newTripActivity;
};

/**
 * Get all activities scheduled for a trip stop
 * @param {string} tripId Trip ID
 * @param {string} stopId Stop ID
 * @param {string} userId Requesting User ID
 */
const getTripActivities = async (tripId, stopId, userId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  if (trip.userId !== userId && !trip.isPublic) {
    throw new ApiError(403, 'You do not have permission to view activities for this private trip');
  }

  const stop = await prisma.tripStop.findFirst({
    where: { id: stopId, tripId },
  });

  if (!stop) {
    throw new ApiError(404, 'Trip stop not found');
  }

  const activities = await prisma.tripActivity.findMany({
    where: { tripStopId: stopId },
    orderBy: { orderIndex: 'asc' },
    include: {
      activity: {
        include: {
          city: true,
        },
      },
    },
  });

  return activities;
};

/**
 * Update a scheduled TripActivity
 * @param {string} tripId Trip ID
 * @param {string} stopId Stop ID
 * @param {string} tripActivityId TripActivity ID
 * @param {string} userId Owner User ID
 * @param {Object} payload Update fields
 */
const updateTripActivity = async (tripId, stopId, tripActivityId, userId, payload) => {
  const { stop } = await checkStopOwnership(tripId, stopId, userId);

  const existingTripActivity = await prisma.tripActivity.findFirst({
    where: { id: tripActivityId, tripStopId: stopId },
    include: { activity: true },
  });

  if (!existingTripActivity) {
    throw new ApiError(404, 'Trip activity not found');
  }

  const newDate = payload.date ? new Date(payload.date) : existingTripActivity.date;
  const stopStart = new Date(stop.startDate);
  const stopEnd = new Date(stop.endDate);

  if (newDate && (newDate < stopStart || newDate > stopEnd)) {
    throw new ApiError(
      400,
      `Activity date (${newDate.toISOString().split('T')[0]}) must fall within stop dates (${
        stopStart.toISOString().split('T')[0]
      } to ${stopEnd.toISOString().split('T')[0]})`
    );
  }

  const newStartTime = payload.startTime !== undefined ? payload.startTime : existingTripActivity.startTime;
  const newDuration = payload.duration !== undefined ? payload.duration : existingTripActivity.duration;

  if (payload.cost !== undefined && payload.cost < 0) {
    throw new ApiError(400, 'Cost cannot be negative');
  }
  if (payload.duration !== undefined && payload.duration <= 0) {
    throw new ApiError(400, 'Duration must be a positive integer in minutes');
  }

  if (newStartTime) {
    const existingActivities = await prisma.tripActivity.findMany({
      where: { tripStopId: stopId },
      include: { activity: true },
    });

    if (checkSchedulingConflict(existingActivities, newDate, newStartTime, newDuration, tripActivityId)) {
      throw new ApiError(
        400,
        'Scheduling conflict detected: another activity is already scheduled at this date and time'
      );
    }
  }

  const updatedTripActivity = await prisma.tripActivity.update({
    where: { id: tripActivityId },
    data: {
      ...(payload.date && { date: newDate }),
      ...(payload.startTime !== undefined && { startTime: payload.startTime || null }),
      ...(payload.duration !== undefined && { duration: payload.duration }),
      ...(payload.cost !== undefined && { cost: payload.cost }),
      ...(payload.notes !== undefined && { notes: payload.notes }),
      ...(payload.orderIndex !== undefined && { orderIndex: payload.orderIndex }),
    },
    include: {
      activity: {
        include: {
          city: true,
        },
      },
    },
  });

  return updatedTripActivity;
};

/**
 * Remove a scheduled activity from a trip stop
 * @param {string} tripId Trip ID
 * @param {string} stopId Stop ID
 * @param {string} tripActivityId TripActivity ID
 * @param {string} userId Owner User ID
 */
const deleteTripActivity = async (tripId, stopId, tripActivityId, userId) => {
  await checkStopOwnership(tripId, stopId, userId);

  const existingTripActivity = await prisma.tripActivity.findFirst({
    where: { id: tripActivityId, tripStopId: stopId },
  });

  if (!existingTripActivity) {
    throw new ApiError(404, 'Trip activity not found');
  }

  await prisma.tripActivity.delete({
    where: { id: tripActivityId },
  });

  return {
    success: true,
    message: 'Trip activity removed successfully',
  };
};

/**
 * Reorder activities in a trip stop using a database transaction
 * @param {string} tripId Trip ID
 * @param {string} stopId Stop ID
 * @param {string} userId Owner User ID
 * @param {Array<string>} orderedIds Array of ordered tripActivity IDs
 */
const reorderTripActivities = async (tripId, stopId, userId, orderedIds) => {
  await checkStopOwnership(tripId, stopId, userId);

  const existingActivities = await prisma.tripActivity.findMany({
    where: { tripStopId: stopId },
  });

  const existingIds = new Set(existingActivities.map((a) => a.id));

  for (const id of orderedIds) {
    if (!existingIds.has(id)) {
      throw new ApiError(400, `Trip activity ID "${id}" does not belong to this stop`);
    }
  }

  if (orderedIds.length !== existingActivities.length) {
    throw new ApiError(400, 'Reorder list must contain all activity IDs for this stop');
  }

  // Atomic reorder transaction
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.tripActivity.update({
        where: { id },
        data: { orderIndex: index + 1 },
      })
    )
  );

  const reorderedActivities = await getTripActivities(tripId, stopId, userId);
  return reorderedActivities;
};

module.exports = {
  checkStopOwnership,
  addTripActivity,
  getTripActivities,
  updateTripActivity,
  deleteTripActivity,
  reorderTripActivities,
};
