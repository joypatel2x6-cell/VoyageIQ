const { z } = require('zod');

const activityCategoryEnum = z.enum([
  'SIGHTSEEING',
  'FOOD',
  'ADVENTURE',
  'CULTURE',
  'SHOPPING',
  'ENTERTAINMENT',
  'NATURE',
  'OTHER',
]);

/**
 * Get Activities Query Validation Schema
 */
const getActivitiesQuerySchema = z.object({
  q: z.string().trim().optional(),
  search: z.string().trim().optional(),
  cityId: z.string().uuid('cityId must be a valid UUID').optional(),
  category: activityCategoryEnum.optional(),
  minCost: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'minCost must be a non-negative number'),
  maxCost: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'maxCost must be a non-negative number'),
  minDuration: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'minDuration must be an integer >= 0'),
  maxDuration: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'maxDuration must be an integer >= 0'),
  rating: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0 && val <= 5), 'rating must be between 0 and 5'),
  minRating: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0 && val <= 5), 'minRating must be between 0 and 5'),
  sort: z
    .enum(['popular', 'rating', 'costLow', 'costHigh', 'duration', 'name', 'createdAt'])
    .optional()
    .default('popular'),
  order: z.enum(['asc', 'desc']).optional(),
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

/**
 * Activity Search Dedicated Query Validation Schema
 */
const activitySearchQuerySchema = z.object({
  q: z.string().trim().optional(),
  search: z.string().trim().optional(),
  cityId: z.string().uuid('cityId must be a valid UUID').optional(),
  category: activityCategoryEnum.optional(),
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

/**
 * Activity ID Parameter Validation Schema
 */
const activityIdParamSchema = z.object({
  activityId: z.string({ required_error: 'Activity ID is required' }).uuid('Activity ID must be a valid UUID'),
});

module.exports = {
  getActivitiesQuerySchema,
  activitySearchQuerySchema,
  activityIdParamSchema,
};
