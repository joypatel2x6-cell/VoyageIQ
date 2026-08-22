const { z } = require('zod');

/**
 * Trip ID Parameter Validation Schema
 */
const tripIdParamSchema = z.object({
  tripId: z.string({ required_error: 'Trip ID is required' }).uuid('Trip ID must be a valid UUID'),
});

/**
 * Share Token Parameter Validation Schema
 */
const shareTokenParamSchema = z.object({
  shareToken: z
    .string({ required_error: 'Share token is required' })
    .trim()
    .min(1, 'Share token cannot be empty'),
});

module.exports = {
  tripIdParamSchema,
  shareTokenParamSchema,
};
