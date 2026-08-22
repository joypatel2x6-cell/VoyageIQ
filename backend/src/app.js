const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const routes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Basic security headers middleware
app.use(helmet());

// 2. CORS configuration
const corsOptions = {
  origin: config.frontendUrl || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// 3. Request logging middleware
if (config.env !== 'test') {
  const logFormat = config.env === 'development' ? 'dev' : 'combined';
  app.use(morgan(logFormat));
}

// 4. JSON body parser & URL-encoded parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. API v1 Versioning prefix route handler
app.use('/api/v1', routes);

// 6. 404 Unhandled Route Handler
app.use(notFoundHandler);

// 7. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
