const { z } = require('zod');

/**
 * Calendar / Timeline URL Params Validation Schema
 */
const calendarParamsSchema = z.object({
  tripId: z.string({ required_error: 'Trip ID is required' }).uuid('Trip ID must be a valid UUID'),
});

/**
 * Single Day Query/Param Validation Schema
 */
const dayParamSchema = z.object({
  tripId: z.string({ required_error: 'Trip ID is required' }).uuid('Trip ID must be a valid UUID'),
  date: z
    .string({ required_error: 'Date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .or(z.string().datetime({ message: 'Date must be a valid ISO date string' })),
});

module.exports = {
  calendarParamsSchema,
  dayParamSchema,
};
