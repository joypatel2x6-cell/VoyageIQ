const { z } = require('zod');

// Currency code validation (ISO 4217 3-letter uppercase format)
const currencyRegex = /^[A-Z]{3}$/;

/**
 * Trip Creation Input Validation Schema
 */
const createTripSchema = z
  .object({
    name: z
      .string({ required_error: 'Trip name is required' })
      .trim()
      .min(1, 'Trip name cannot be empty'),
    description: z.string().trim().optional(),
    startDate: z
      .string({ required_error: 'Start date is required' })
      .datetime({ message: 'Start date must be a valid ISO date string' })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD format')),
    endDate: z
      .string({ required_error: 'End date is required' })
      .datetime({ message: 'End date must be a valid ISO date string' })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD format')),
    budget: z
      .number({ required_error: 'Budget is required' })
      .min(0, 'Budget must be greater than or equal to 0')
      .or(
        z
          .string()
          .transform((val) => parseFloat(val))
          .refine((val) => !isNaN(val) && val >= 0, 'Budget must be a valid non-negative number')
      ),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(currencyRegex, 'Currency must be a 3-letter currency code (e.g. USD, EUR)')
      .optional()
      .default('USD'),
    travelers: z
      .number()
      .int()
      .min(1, 'Number of travelers must be at least 1')
      .optional()
      .default(1)
      .or(
        z
          .string()
          .transform((val) => parseInt(val, 10))
          .refine((val) => !isNaN(val) && val >= 1, 'Travelers must be an integer >= 1')
      ),
    travelStyle: z.string().trim().optional(),
    coverImage: z.string().trim().url('Cover image must be a valid URL').optional().or(z.literal('')),
    isPublic: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    },
    {
      message: 'End date cannot be before start date',
      path: ['endDate'],
    }
  );

/**
 * Trip Update Input Validation Schema
 */
const updateTripSchema = z
  .object({
    name: z.string().trim().min(1, 'Trip name cannot be empty').optional(),
    description: z.string().trim().optional(),
    startDate: z
      .string()
      .datetime({ message: 'Start date must be a valid ISO date string' })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD format'))
      .optional(),
    endDate: z
      .string()
      .datetime({ message: 'End date must be a valid ISO date string' })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD format'))
      .optional(),
    budget: z
      .number()
      .min(0, 'Budget must be greater than or equal to 0')
      .optional()
      .or(
        z
          .string()
          .transform((val) => parseFloat(val))
          .refine((val) => !isNaN(val) && val >= 0, 'Budget must be a valid non-negative number')
      ),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(currencyRegex, 'Currency must be a 3-letter currency code')
      .optional(),
    travelers: z
      .number()
      .int()
      .min(1, 'Number of travelers must be at least 1')
      .optional()
      .or(
        z
          .string()
          .transform((val) => parseInt(val, 10))
          .refine((val) => !isNaN(val) && val >= 1, 'Travelers must be an integer >= 1')
      ),
    travelStyle: z.string().trim().optional(),
    coverImage: z.string().trim().url('Cover image must be a valid URL').optional().or(z.literal('')),
    isPublic: z.boolean().optional(),
    status: z.enum(['ONGOING', 'UPCOMING', 'COMPLETED', 'DRAFT']).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return end >= start;
      }
      return true;
    },
    {
      message: 'End date cannot be before start date',
      path: ['endDate'],
    }
  );

/**
 * Get My Trips Query Filter Validation Schema
 */
const getTripsQuerySchema = z.object({
  status: z.enum(['ONGOING', 'UPCOMING', 'COMPLETED', 'DRAFT']).optional(),
  search: z.string().trim().optional(),
  destination: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['startDate', 'endDate', 'createdAt', 'name', 'budget']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
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
 * Trip ID Parameter Validation Schema
 */
const tripIdParamSchema = z.object({
  tripId: z.string({ required_error: 'Trip ID is required' }).uuid('Trip ID must be a valid UUID'),
});

module.exports = {
  createTripSchema,
  updateTripSchema,
  getTripsQuerySchema,
  tripIdParamSchema,
};
