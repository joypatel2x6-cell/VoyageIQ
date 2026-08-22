const { z } = require('zod');

/**
 * Get Cities Query Filter & Search Validation Schema
 */
const getCitiesQuerySchema = z.object({
  search: z.string().trim().optional(),
  q: z.string().trim().optional(),
  country: z.string().trim().optional(),
  region: z.string().trim().optional(),
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
  minPopularity: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'minPopularity must be an integer >= 0'),
  maxPopularity: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'maxPopularity must be an integer >= 0'),
  sort: z
    .enum(['popularity', 'cost', 'costIndex', 'averageDailyCost', 'name', 'createdAt'])
    .optional(),
  sortBy: z
    .enum(['popularity', 'cost', 'costIndex', 'averageDailyCost', 'name', 'createdAt'])
    .optional(),
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
 * City Search Dedicated Query Validation Schema
 */
const citySearchQuerySchema = z.object({
  q: z.string().trim().optional(),
  search: z.string().trim().optional(),
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
 * City ID Parameter Validation Schema
 */
const cityIdParamSchema = z.object({
  cityId: z.string({ required_error: 'City ID is required' }).uuid('City ID must be a valid UUID'),
});

/**
 * Get City Activities Query Filter Validation Schema
 */
const getCityActivitiesQuerySchema = z.object({
  category: z
    .enum([
      'SIGHTSEEING',
      'FOOD',
      'ADVENTURE',
      'CULTURE',
      'SHOPPING',
      'ENTERTAINMENT',
      'NATURE',
      'OTHER',
    ])
    .optional(),
  search: z.string().trim().optional(),
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
  getCitiesQuerySchema,
  citySearchQuerySchema,
  cityIdParamSchema,
  getCityActivitiesQuerySchema,
};
