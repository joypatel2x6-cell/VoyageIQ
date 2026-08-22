const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get authenticated user's notifications
 * GET /api/v1/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user.id, req.query);
  res.status(200).json({
    success: true,
    message: 'Notifications retrieved successfully',
    data: result.notifications,
    unreadCount: result.unreadCount,
    pagination: result.pagination,
  });
});

/**
 * Controller: Mark a single notification as read
 * PATCH /api/v1/notifications/:notificationId/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.notificationId, req.user.id);
  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    notification,
  });
});

/**
 * Controller: Mark all unread notifications as read
 * PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  res.status(200).json({
    success: true,
    message: result.message,
    count: result.count,
  });
});

/**
 * Controller: Delete a notification by ID
 * DELETE /api/v1/notifications/:notificationId
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(req.params.notificationId, req.user.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
