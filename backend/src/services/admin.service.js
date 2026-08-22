const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { sanitizeUser } = require('./auth.service');

/**
 * Fetch paginated list of system users with search, filtering, and counts
 * Excludes passwordHash
 */
const getUsers = async (query = {}) => {
  const { search, role, isActive, page = 1, limit = 10 } = query;

  const where = {};

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        city: true,
        country: true,
        bio: true,
        language: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            trips: true,
            communityPosts: true,
            savedDestinations: true,
          },
        },
      },
    }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get detailed user profile with full breakdown of trips, posts, and activities
 * Excludes passwordHash
 */
const getUserDetail = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profileImage: true,
      city: true,
      country: true,
      bio: true,
      language: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      trips: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          budget: true,
          currency: true,
          isPublic: true,
          status: true,
          createdAt: true,
        },
      },
      communityPosts: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          _count: {
            select: { likes: true, comments: true },
          },
        },
      },
      savedDestinations: {
        include: { city: true },
      },
      _count: {
        select: {
          trips: true,
          communityPosts: true,
          comments: true,
          likes: true,
          notifications: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

/**
 * Update user status (isActive) and/or role (USER/ADMIN)
 * Prevents admins from modifying their own status/role
 */
const updateUserStatus = async (userId, payload, adminUserId) => {
  if (userId === adminUserId) {
    throw new ApiError(400, 'Admins cannot modify their own account status or role via admin API');
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(404, 'User not found');
  }

  let isActive = payload.isActive;
  if (payload.status !== undefined) {
    isActive = payload.status === 'active';
  }

  const updateData = {};
  if (isActive !== undefined) {
    updateData.isActive = isActive;
  }
  if (payload.role) {
    updateData.role = payload.role;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profileImage: true,
      city: true,
      country: true,
      bio: true,
      language: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/**
 * Delete a user by ID
 * Prevents admins from deleting their own account
 */
const deleteUser = async (userId, adminUserId) => {
  if (userId === adminUserId) {
    throw new ApiError(400, 'Admins cannot delete their own account');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return {
    success: true,
    message: 'User deleted successfully',
  };
};

/**
 * Get overall system statistics metrics
 */
const getStatistics = async () => {
  const [totalUsers, totalTrips, publicTrips, totalCities, totalActivities] = await Promise.all([
    prisma.user.count(),
    prisma.trip.count(),
    prisma.trip.count({ where: { isPublic: true } }),
    prisma.city.count(),
    prisma.activity.count(),
  ]);

  return {
    totalUsers,
    totalTrips,
    publicTrips,
    totalCities,
    totalActivities,
  };
};

/**
 * Get popular cities calculated based on trip stops count
 * @param {number} limit Number of top cities to return
 */
const getPopularCities = async (limit = 10) => {
  const popularStops = await prisma.tripStop.groupBy({
    by: ['cityId'],
    _count: { cityId: true },
    orderBy: {
      _count: { cityId: 'desc' },
    },
    take: limit,
  });

  const cityIds = popularStops.map((s) => s.cityId);

  const cities = await prisma.city.findMany({
    where: { id: { in: cityIds } },
  });

  const cityMap = new Map(cities.map((c) => [c.id, c]));

  return popularStops.map((s) => ({
    city: cityMap.get(s.cityId) || null,
    tripCount: s._count.cityId,
  }));
};

/**
 * Get popular activities calculated based on trip activities count
 * @param {number} limit Number of top activities to return
 */
const getPopularActivities = async (limit = 10) => {
  const popularActivities = await prisma.tripActivity.groupBy({
    by: ['activityId'],
    _count: { activityId: true },
    orderBy: {
      _count: { activityId: 'desc' },
    },
    take: limit,
  });

  const activityIds = popularActivities.map((a) => a.activityId);

  const activities = await prisma.activity.findMany({
    where: { id: { in: activityIds } },
    include: { city: true },
  });

  const activityMap = new Map(activities.map((a) => [a.id, a]));

  return popularActivities.map((a) => ({
    activity: activityMap.get(a.activityId) || null,
    usageCount: a._count.activityId,
  }));
};

/**
 * Get user registration and trip creation trends grouped by month
 */
const getUserTrends = async () => {
  const [users, trips] = await Promise.all([
    prisma.user.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.trip.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const trendsMap = new Map();

  for (const u of users) {
    const period = u.createdAt.toISOString().substring(0, 7); // YYYY-MM
    if (!trendsMap.has(period)) {
      trendsMap.set(period, { period, userCount: 0, tripCount: 0 });
    }
    trendsMap.get(period).userCount += 1;
  }

  for (const t of trips) {
    const period = t.createdAt.toISOString().substring(0, 7);
    if (!trendsMap.has(period)) {
      trendsMap.set(period, { period, userCount: 0, tripCount: 0 });
    }
    trendsMap.get(period).tripCount += 1;
  }

  const trends = Array.from(trendsMap.values()).sort((a, b) => a.period.localeCompare(b.period));

  return trends;
};

module.exports = {
  getUsers,
  getUserDetail,
  updateUserStatus,
  deleteUser,
  getStatistics,
  getPopularCities,
  getPopularActivities,
  getUserTrends,
};
