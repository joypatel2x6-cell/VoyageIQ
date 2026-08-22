const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');

const router = express.Router();

// Register v1 routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

module.exports = router;
