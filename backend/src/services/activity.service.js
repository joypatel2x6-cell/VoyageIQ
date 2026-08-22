const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

/**
 * Get paginated list of activities with search, multi-field filtering, and sorting
 * @param {Object} query Query parameters
 */
const getActivities = async (query) => {
  const {
    q,
    search,
    cityId,
    category,
    minCost,
    maxCost,
    minDuration,
    maxDuration,
    rating,
    minRating,
    sort = 'popular',
    order,
    page = 1,
    limit = 10,
  } = query;

  const where = {};
  const AND = [];

  // City ID filter
  if (cityId) {
    AND.push({ cityId });
  }

  // Activity Category filter
  if (category) {
    AND.push({ category });
  }

  // Text search across name and description
  const searchText = q || search;
  if (searchText) {
    AND.push({
      OR: [
        { name: { contains: searchText, mode: 'insensitive' } },
        { description: { contains: searchText, mode: 'insensitive' } },
      ],
    });
  }

  // Cost filter
  if (minCost !== undefined || maxCost !== undefined) {
    const costCondition = {};
    if (minCost !== undefined) costCondition.gte = minCost;
    if (maxCost !== undefined) costCondition.lte = maxCost;
    AND.push({ cost: costCondition });
  }

  // Duration filter (in minutes)
  if (minDuration !== undefined || maxDuration !== undefined) {
    const durationCondition = {};
    if (minDuration !== undefined) durationCondition.gte = minDuration;
    if (maxDuration !== undefined) durationCondition.lte = maxDuration;
    AND.push({ duration: durationCondition });
  }

  // Rating filter
  const targetRating = rating !== undefined ? rating : minRating;
  if (targetRating !== undefined) {
    AND.push({ rating: { gte: targetRating } });
  }

  if (AND.length > 0) {
    where.AND = AND;
  }

  // Sorting options: popular, rating, costLow, costHigh, duration, name, createdAt
  let orderBy = { rating: 'desc' };

  switch (sort) {
    case 'popular':
    case 'rating':
      orderBy = { rating: 'desc' };
      break;
    case 'costLow':
      orderBy = { cost: 'asc' };
      break;
    case 'costHigh':
      orderBy = { cost: 'desc' };
      break;
    case 'duration':
      orderBy = { duration: order || 'asc' };
      break;
    case 'name':
      orderBy = { name: order || 'asc' };
      break;
    case 'createdAt':
      orderBy = { createdAt: order || 'desc' };
      break;
    default:
      orderBy = { rating: 'desc' };
      break;
  }

  const skip = (page - 1) * limit;

  const [total, activities] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        city: {
          select: {
            id: true,
            name: true,
            country: true,
            region: true,
            image: true,
          },
        },
      },
    }),
  ]);

  return {
    activities,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Dedicated Activity Search
 * @param {Object} query Query options
 */
const searchActivities = async (query) => {
  return getActivities(query);
};

/**
 * Get Activity details by ID
 * @param {string} activityId Activity ID
 */
const getActivityById = async (activityId) => {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      city: {
        select: {
          id: true,
          name: true,
          country: true,
          region: true,
          image: true,
        },
      },
    },
  });

  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  return activity;
};

/**
 * Get Activities in a specific City with filtering & search
 * @param {string} cityId City ID
 * @param {Object} query Query options
 */
const getCityActivities = async (cityId, query) => {
  const city = await prisma.city.findUnique({
    where: { id: cityId },
  });

  if (!city) {
    throw new ApiError(404, 'City not found');
  }

  const result = await getActivities({ ...query, cityId });
  return {
    city: {
      id: city.id,
      name: city.name,
      country: city.country,
      region: city.region,
    },
    ...result,
  };
};

module.exports = {
  getActivities,
  searchActivities,
  getActivityById,
  getCityActivities,
};
