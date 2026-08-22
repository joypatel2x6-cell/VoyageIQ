const config = require('../config/env');
const { ZodError } = require('zod');

/**
 * Centralized Express Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle Zod validation errors cleanly
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development' && statusCode === 500) {
    console.error('[Unhandled Error]', err);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
