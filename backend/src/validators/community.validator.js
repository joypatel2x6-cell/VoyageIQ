const { z } = require('zod');

const travelStyleEnum = z.enum([
  'SOLO',
  'COUPLE',
  'FAMILY',
  'FRIENDS',
  'BUSINESS',
  'BACKPACKER',
  'LUXURY',
]);

/**
 * Create Community Post Input Validation Schema
 */
const createPostSchema = z.object({
  tripId: z
    .string({ required_error: 'Trip ID is required' })
    .uuid('Trip ID must be a valid UUID'),
  content: z
    .string({ required_error: 'Content is required' })
    .trim()
    .min(3, 'Post content must be at least 3 characters long'),
});

/**
 * Update Community Post Input Validation Schema
 */
const updatePostSchema = z.object({
  content: z
    .string({ required_error: 'Content is required' })
    .trim()
    .min(3, 'Post content must be at least 3 characters long'),
});

/**
 * Create Comment Input Validation Schema
 */
const createCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment content cannot be empty'),
});

/**
 * Get Community Posts Query Validation Schema
 */
const getPostsQuerySchema = z.object({
  search: z.string().trim().optional(),
  q: z.string().trim().optional(),
  destination: z.string().trim().optional(),
  budget: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'Budget must be a non-negative number'),
  maxBudget: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'maxBudget must be a non-negative number'),
  travelStyle: travelStyleEnum.optional(),
  sort: z.enum(['recent', 'popular', 'budgetLow', 'budgetHigh']).optional().default('recent'),
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
 * Post & Comment ID Params Validation Schemas
 */
const postIdParamSchema = z.object({
  postId: z.string({ required_error: 'Post ID is required' }).uuid('Post ID must be a valid UUID'),
});

const commentIdParamSchema = z.object({
  commentId: z.string({ required_error: 'Comment ID is required' }).uuid('Comment ID must be a valid UUID'),
});

module.exports = {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  getPostsQuerySchema,
  postIdParamSchema,
  commentIdParamSchema,
};
