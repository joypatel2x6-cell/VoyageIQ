const { z } = require('zod');

const expenseCategoryEnum = z.enum([
  'TRANSPORT',
  'ACCOMMODATION',
  'ACTIVITY',
  'FOOD',
  'OTHER',
]);

/**
 * Add Manual Expense Input Validation Schema
 */
const addExpenseSchema = z.object({
  category: expenseCategoryEnum,
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Expense amount must be a positive number')
    .or(
      z
        .string()
        .transform((val) => parseFloat(val))
        .refine((val) => !isNaN(val) && val > 0, 'Expense amount must be a positive number')
    ),
  currency: z.string().trim().length(3, 'Currency code must be 3 characters (e.g. USD, EUR, INR)').optional().default('USD'),
  description: z.string().trim().optional(),
  date: z
    .string()
    .datetime({ message: 'Date must be a valid ISO date string' })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'))
    .optional(),
});

/**
 * Update Manual Expense Input Validation Schema
 */
const updateExpenseSchema = z.object({
  category: expenseCategoryEnum.optional(),
  amount: z
    .number()
    .positive('Expense amount must be a positive number')
    .optional()
    .or(
      z
        .string()
        .transform((val) => parseFloat(val))
        .refine((val) => !isNaN(val) && val > 0, 'Expense amount must be a positive number')
    ),
  currency: z.string().trim().length(3).optional(),
  description: z.string().trim().optional(),
  date: z
    .string()
    .datetime({ message: 'Date must be a valid ISO date string' })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'))
    .optional(),
});

/**
 * Budget URL Params Validation Schema
 */
const budgetParamsSchema = z.object({
  tripId: z.string({ required_error: 'Trip ID is required' }).uuid('Trip ID must be a valid UUID'),
  expenseId: z.string().uuid('Expense ID must be a valid UUID').optional(),
});

module.exports = {
  addExpenseSchema,
  updateExpenseSchema,
  budgetParamsSchema,
};
