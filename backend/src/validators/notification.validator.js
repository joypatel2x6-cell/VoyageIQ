const { z } = require('zod');

/**
 * Notification ID Parameter Validation Schema
 */
const notificationIdParamSchema = z.object({
  notificationId: z
    .string({ required_error: 'Notification ID is required' })
    .uuid('Notification ID must be a valid UUID'),
});

/**
 * Get Notifications Query Validation Schema
 */
const getNotificationsQuerySchema = z.object({
  isRead: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1, 'Page must be an integer >= 1'),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
});

module.exports = {
  notificationIdParamSchema,
  getNotificationsQuerySchema,
};
