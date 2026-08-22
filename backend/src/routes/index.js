const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const tripRoutes = require('./trip.routes');
const cityRoutes = require('./city.routes');
const activityRoutes = require('./activity.routes');
const communityRoutes = require('./community.routes');
const sharingRoutes = require('./sharing.routes');
const notificationRoutes = require('./notification.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

// Register v1 routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/trips', tripRoutes);
router.use('/cities', cityRoutes);
router.use('/activities', activityRoutes);
router.use('/community', communityRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/', sharingRoutes);

module.exports = router;



