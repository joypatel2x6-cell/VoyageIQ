const asyncHandler = require('../utils/asyncHandler');

/**
 * Generic request validation middleware generator using Zod schema
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
const validate = (schema, source = 'body') =>
  asyncHandler(async (req, res, next) => {
    const validated = await schema.parseAsync(req[source]);
    req[source] = validated;
    next();
  });

module.exports = validate;
