const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

/**
 * Get paginated list of cities with search, filtering, and sorting
 * @param {Object} query Query options
 */
const getCities = async (query) => {
  const {
    search,
    q,
    country,
    region,
    minCost,
    maxCost,
    minPopularity,
    maxPopularity,
    sort,
    sortBy,
    order,
    page = 1,
    limit = 10,
  } = query;

  const where = {};
  const AND = [];

  // Text search across name, country, region
  const searchText = q || search;
  if (searchText) {
    AND.push({
      OR: [
        { name: { contains: searchText, mode: 'insensitive' } },
        { country: { contains: searchText, mode: 'insensitive' } },
        { region: { contains: searchText, mode: 'insensitive' } },
      ],
    });
  }

  // Country filter (partial or exact)
  if (country) {
    AND.push({
      country: { contains: country, mode: 'insensitive' },
    });
  }

  // Region filter
  if (region) {
    AND.push({
      region: { contains: region, mode: 'insensitive' },
    });
  }

  // Cost Index / Average Daily Cost filter
  if (minCost !== undefined || maxCost !== undefined) {
    const costCondition = {};
    if (minCost !== undefined) costCondition.gte = minCost;
    if (maxCost !== undefined) costCondition.lte = maxCost;

    AND.push({
      OR: [
        { costIndex: costCondition },
        { averageDailyCost: costCondition },
      ],
    });
  }

  // Popularity filter
  if (minPopularity !== undefined || maxPopularity !== undefined) {
    const popCondition = {};
    if (minPopularity !== undefined) popCondition.gte = minPopularity;
    if (maxPopularity !== undefined) popCondition.lte = maxPopularity;
    AND.push({ popularity: popCondition });
  }

  if (AND.length > 0) {
    where.AND = AND;
  }

  // Determine sorting criteria
  const requestedSort = sort || sortBy || 'popularity';
  let sortField = 'popularity';
  let sortOrder = order || 'desc';

  if (requestedSort === 'cost' || requestedSort === 'costIndex' || requestedSort === 'averageDailyCost') {
    sortField = 'averageDailyCost';
    if (!order) sortOrder = 'asc';
  } else if (requestedSort === 'name') {
    sortField = 'name';
    if (!order) sortOrder = 'asc';
  } else if (requestedSort === 'createdAt') {
    sortField = 'createdAt';
    if (!order) sortOrder = 'desc';
  } else {
    sortField = 'popularity';
    if (!order) sortOrder = 'desc';
  }

  const skip = (page - 1) * limit;

  const [total, cities] = await Promise.all([
    prisma.city.count({ where }),
    prisma.city.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit,
    }),
  ]);

  return {
    cities,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Dedicated City Search method
 * @param {Object} query Query options containing q or search string
 */
const searchCities = async (query) => {
  return getCities(query);
};

/**
 * Get City by ID
 * @param {string} cityId City ID
 */
const getCityById = async (cityId) => {
  const city = await prisma.city.findUnique({
    where: { id: cityId },
    include: {
      _count: {
        select: {
          activities: true,
          tripStops: true,
        },
      },
    },
  });

  if (!city) {
    throw new ApiError(404, 'City not found');
  }

  return city;
};

/**
 * Get Activities available for a specific City
 * @param {string} cityId City ID
 * @param {Object} query Filters (category, search, page, limit)
 */
const getCityActivities = async (cityId, query) => {
  // Check if city exists
  const city = await prisma.city.findUnique({
    where: { id: cityId },
  });

  if (!city) {
    throw new ApiError(404, 'City not found');
  }

  const { category, search, page = 1, limit = 10 } = query;

  const where = {
    cityId,
  };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, activities] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: { rating: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return {
    city: {
      id: city.id,
      name: city.name,
      country: city.country,
    },
    activities,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  getCities,
  searchCities,
  getCityById,
  getCityActivities,
};
