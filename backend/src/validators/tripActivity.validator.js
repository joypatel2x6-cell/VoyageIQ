const { z } = require('zod');

// Time format regex (HH:MM, e.g., "09:30", "14:15")
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Add Activity to Trip Stop Validation Schema
 */
const addTripActivitySchema = z.object({
  activityId: z
    .string({ required_error: 'Activity ID is required' })
    .uuid('Activity ID must be a valid UUID'),
  date: z
    .string()
    .datetime({ message: 'Date must be a valid ISO date string' })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'))
    .optional(),
  startTime: z
    .string()
    .trim()
    .regex(timeRegex, 'Start time must be in HH:MM 24-hour format (e.g. 09:30, 14:00)')
    .optional()
    .or(z.literal('')),
  duration: z
    .number()
    .int()
    .min(1, 'Duration must be a positive integer in minutes')
    .optional()
    .or(
      z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val >= 1, 'Duration must be a positive integer in minutes')
    ),
  cost: z
    .number()
    .min(0, 'Cost cannot be negative')
    .optional()
    .or(
      z
        .string()
        .transform((val) => parseFloat(val))
        .refine((val) => !isNaN(val) && val >= 0, 'Cost cannot be negative')
    ),
  notes: z.string().trim().optional(),
});

/**
 * Update Scheduled Trip Activity Validation Schema
 */
const updateTripActivitySchema = z.object({
  date: z
    .string()
    .datetime({ message: 'Date must be a valid ISO date string' })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'))
    .optional(),
  startTime: z
    .string()
    .trim()
    .regex(timeRegex, 'Start time must be in HH:MM format')
    .optional()
    .or(z.literal('')),
  duration: z
    .number()
    .int()
    .min(1, 'Duration must be a positive integer in minutes')
    .optional()
    .or(
      z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val >= 1, 'Duration must be a positive integer in minutes')
    ),
  cost: z
    .number()
    .min(0, 'Cost cannot be negative')
    .optional()
    .or(
      z
        .string()
        .transform((val) => parseFloat(val))
        .refine((val) => !isNaN(val) && val >= 0, 'Cost cannot be negative')
    ),
  notes: z.string().trim().optional(),
  orderIndex: z.number().int().min(1).optional(),
});

/**
 * Reorder Trip Activities Validation Schema
 */
const reorderTripActivitiesSchema = z.object({
  tripActivityIds: z
    .array(z.string().uuid('Each tripActivityId must be a valid UUID'))
    .min(1, 'tripActivityIds must contain at least one ID')
    .optional(),
  activityIds: z
    .array(z.string().uuid('Each activityId must be a valid UUID'))
    .min(1, 'activityIds must contain at least one ID')
    .optional(),
}).refine((data) => data.tripActivityIds || data.activityIds, {
  message: 'Either tripActivityIds or activityIds array must be provided',
  path: ['tripActivityIds'],
});

/**
 * Trip Activity Parameter Validation Schema
 */
const tripActivityParamsSchema = z.object({
  tripId: z.string().uuid('Trip ID must be a valid UUID'),
  stopId: z.string().uuid('Stop ID must be a valid UUID'),
  tripActivityId: z.string().uuid('Trip Activity ID must be a valid UUID').optional(),
});

module.exports = {
  addTripActivitySchema,
  updateTripActivitySchema,
  reorderTripActivitiesSchema,
  tripActivityParamsSchema,
};
