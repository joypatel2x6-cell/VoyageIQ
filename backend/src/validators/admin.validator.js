const { z } = require('zod');

/**
 * User ID Parameter Validation Schema
 */
const userIdParamSchema = z.object({
  userId: z.string({ required_error: 'User ID is required' }).uuid('User ID must be a valid UUID'),
});

/**
 * Update User Status & Role Validation Schema
 */
const updateUserStatusSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  status: z.enum(['active', 'inactive', 'deactivated']).optional(),
}).refine(
  (data) => data.isActive !== undefined || data.role !== undefined || data.status !== undefined,
  'At least one field (isActive, role, or status) must be provided'
);

/**
 * Admin Get Users Query Filters Schema
 */
const getAdminUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z
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
  userIdParamSchema,
  updateUserStatusSchema,
  getAdminUsersQuerySchema,
};
