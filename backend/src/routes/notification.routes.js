const express = require('express');
const notificationController = require('../controllers/notification.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  notificationIdParamSchema,
  getNotificationsQuerySchema,
} = require('../validators/notification.validator');

const router = express.Router();

// All notification routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get authenticated user's notifications
 * @access  Private
 */
router.get('/', validate(getNotificationsQuerySchema, 'query'), notificationController.getNotifications);

/**
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all unread notifications for authenticated user as read
 * @access  Private
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * @route   PATCH /api/v1/notifications/:notificationId/read
 * @desc    Mark a specific notification as read
 * @access  Private (Owner)
 */
router.patch(
  '/:notificationId/read',
  validate(notificationIdParamSchema, 'params'),
  notificationController.markAsRead
);

/**
 * @route   DELETE /api/v1/notifications/:notificationId
 * @desc    Delete a specific notification
 * @access  Private (Owner)
 */
router.delete(
  '/:notificationId',
  validate(notificationIdParamSchema, 'params'),
  notificationController.deleteNotification
);

module.exports = router;
