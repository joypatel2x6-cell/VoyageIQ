const { z } = require('zod');

/**
 * Add Trip Stop Input Validation Schema
 */
const addStopSchema = z
  .object({
    cityId: z
      .string({ required_error: 'City ID is required' })
      .uuid('City ID must be a valid UUID'),
    startDate: z
      .string({ required_error: 'Start date is required' })
      .datetime({ message: 'Start date must be a valid ISO date string' })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD format')),
    endDate: z
      .string({ required_error: 'End date is required' })
      .datetime({ message: 'End date must be a valid ISO date string' })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD format')),
    notes: z.string().trim().optional(),
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
 * Update Trip Stop Input Validation Schema
 */
const updateStopSchema = z
  .object({
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
    notes: z.string().trim().optional(),
    orderIndex: z.number().int().min(1).optional(),
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
 * Reorder Trip Stops Validation Schema
 */
const reorderStopsSchema = z.object({
  stopIds: z
    .array(z.string().uuid('Each stop ID must be a valid UUID'))
    .min(1, 'stopIds array must contain at least one stop ID'),
});

/**
 * Trip Stop Params Validation Schema
 */
const tripStopParamsSchema = z.object({
  tripId: z.string({ required_error: 'Trip ID is required' }).uuid('Trip ID must be a valid UUID'),
  stopId: z.string().uuid('Stop ID must be a valid UUID').optional(),
});

module.exports = {
  addStopSchema,
  updateStopSchema,
  reorderStopsSchema,
  tripStopParamsSchema,
};
