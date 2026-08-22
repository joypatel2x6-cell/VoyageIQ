const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

/**
 * Core helper function to create a new Notification for a user
 * @param {string} userId Recipient User ID
 * @param {Object} payload Notification payload
 * @param {string} payload.title Notification title
 * @param {string} payload.message Notification message
 * @param {string} payload.type Notification category type (TRIP_SHARED, TRIP_COPIED, COMMUNITY_INTERACTION, BUDGET_WARNING, BUDGET_EXCEEDED, TRIP_STARTING_SOON, SYSTEM)
 */
const createNotification = async (userId, { title, message, type = 'SYSTEM' }) => {
  if (!userId) return null;

  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
    },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      createdAt: true,
    },
  });

  return notification;
};

/**
 * Get paginated notifications belonging exclusively to the authenticated user
 * Automatically checks for upcoming trips starting within 7 days to trigger TRIP_STARTING_SOON notifications
 * @param {string} userId Authenticated User ID
 * @param {Object} query Query options (isRead, page, limit)
 */
const getUserNotifications = async (userId, query = {}) => {
  const { isRead, page = 1, limit = 10 } = query;

  // 1. Check for upcoming trips starting within 7 days to generate automated TRIP_STARTING_SOON notifications
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingTrips = await prisma.trip.findMany({
    where: {
      userId,
      startDate: {
        gte: now,
        lte: sevenDaysLater,
      },
    },
  });

  for (const trip of upcomingTrips) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: 'TRIP_STARTING_SOON',
        title: `Trip Starting Soon: ${trip.name}`,
      },
    });

    if (!existing) {
      const daysLeft = Math.max(1, Math.ceil((new Date(trip.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      await createNotification(userId, {
        title: `Trip Starting Soon: ${trip.name}`,
        message: `Your trip "${trip.name}" starts in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`,
        type: 'TRIP_STARTING_SOON',
      });
    }
  }

  // 2. Build Prisma filter clause strictly scoped to user
  const where = {
    userId,
  };

  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  const skip = (page - 1) * limit;

  const [total, unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Mark a single notification as read (User ownership verified)
 * @param {string} notificationId Notification ID
 * @param {string} userId Requesting User ID
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (notification.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to update this notification');
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      createdAt: true,
    },
  });

  return updatedNotification;
};

/**
 * Mark all unread notifications for the authenticated user as read
 * @param {string} userId Authenticated User ID
 */
const markAllAsRead = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return {
    count: result.count,
    message: 'All notifications marked as read successfully',
  };
};

/**
 * Delete a notification by ID (User ownership verified)
 * @param {string} notificationId Notification ID
 * @param {string} userId Requesting User ID
 */
const deleteNotification = async (notificationId, userId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  if (notification.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to delete this notification');
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return {
    success: true,
    message: 'Notification deleted successfully',
  };
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
