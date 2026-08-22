const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

/**
 * Format user summary object for API responses
 */
const formatUserSummary = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImage: user.profileImage,
    city: user.city,
    country: user.country,
  };
};

/**
 * Format trip summary object for API responses
 */
const formatTripSummary = (trip) => {
  if (!trip) return null;
  return {
    id: trip.id,
    name: trip.name,
    description: trip.description,
    startDate: trip.startDate,
    endDate: trip.endDate,
    budget: trip.budget,
    currency: trip.currency,
    travelers: trip.travelers,
    travelStyle: trip.travelStyle,
    coverImage: trip.coverImage,
    isPublic: trip.isPublic,
    shareToken: trip.shareToken,
    stops: trip.tripStops
      ? trip.tripStops.map((stop) => ({
          id: stop.id,
          city: stop.city
            ? {
                id: stop.city.id,
                name: stop.city.name,
                country: stop.city.country,
                region: stop.city.region,
                image: stop.city.image,
              }
            : null,
          startDate: stop.startDate,
          endDate: stop.endDate,
          orderIndex: stop.orderIndex,
        }))
      : [],
  };
};

/**
 * Format a community post response payload
 */
const formatPostResponse = (post, currentUserId = null) => {
  const isLikedByMe = currentUserId
    ? post.likes && Array.isArray(post.likes) && post.likes.some((l) => l.userId === currentUserId)
    : false;

  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    user: formatUserSummary(post.user),
    trip: formatTripSummary(post.trip),
    likesCount: post._count ? post._count.likes : post.likes ? post.likes.length : 0,
    commentsCount: post._count ? post._count.comments : post.comments ? post.comments.length : 0,
    isLikedByMe,
  };
};

/**
 * Create and publish a community post for a trip
 * Automatically marks the published trip as public
 */
const createPost = async (userId, { tripId, content }) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new ApiError(404, 'Trip not found');
  }

  if (trip.userId !== userId) {
    throw new ApiError(403, 'You can only publish posts for your own trips');
  }

  // Automatically ensure the published trip is set to public
  if (!trip.isPublic) {
    await prisma.trip.update({
      where: { id: tripId },
      data: { isPublic: true },
    });
  }

  const newPost = await prisma.communityPost.create({
    data: {
      userId,
      tripId,
      content,
    },
    include: {
      user: true,
      trip: {
        include: {
          tripStops: {
            orderBy: { orderIndex: 'asc' },
            include: { city: true },
          },
        },
      },
      likes: {
        select: { userId: true },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });

  return formatPostResponse(newPost, userId);
};

/**
 * Get public community posts with filtering, search, sorting, and pagination
 */
const getPosts = async (query, currentUserId = null) => {
  const {
    search,
    q,
    destination,
    budget,
    maxBudget,
    travelStyle,
    sort = 'recent',
    page = 1,
    limit = 10,
  } = query;

  // Strict Privacy Rule: ONLY posts with public trips are shown in community feed
  const where = {
    trip: {
      isPublic: true,
    },
  };

  const AND = [];

  // Search keyword (matches post content, trip name/description, or author name)
  const searchText = search || q;
  if (searchText) {
    AND.push({
      OR: [
        { content: { contains: searchText, mode: 'insensitive' } },
        { trip: { name: { contains: searchText, mode: 'insensitive' } } },
        { trip: { description: { contains: searchText, mode: 'insensitive' } } },
        { user: { firstName: { contains: searchText, mode: 'insensitive' } } },
        { user: { lastName: { contains: searchText, mode: 'insensitive' } } },
      ],
    });
  }

  // Destination filter (matches city name, country, or region in trip stops)
  if (destination) {
    AND.push({
      trip: {
        tripStops: {
          some: {
            city: {
              OR: [
                { name: { contains: destination, mode: 'insensitive' } },
                { country: { contains: destination, mode: 'insensitive' } },
                { region: { contains: destination, mode: 'insensitive' } },
              ],
            },
          },
        },
      },
    });
  }

  // Budget filter
  const targetBudget = maxBudget !== undefined ? maxBudget : budget;
  if (targetBudget !== undefined) {
    AND.push({
      trip: {
        budget: { lte: targetBudget },
      },
    });
  }

  // Travel style filter
  if (travelStyle) {
    AND.push({
      trip: {
        travelStyle,
      },
    });
  }

  if (AND.length > 0) {
    where.AND = AND;
  }

  // Sorting
  let orderBy = { createdAt: 'desc' };
  switch (sort) {
    case 'recent':
      orderBy = { createdAt: 'desc' };
      break;
    case 'popular':
      orderBy = { likes: { _count: 'desc' } };
      break;
    case 'budgetLow':
      orderBy = { trip: { budget: 'asc' } };
      break;
    case 'budgetHigh':
      orderBy = { trip: { budget: 'desc' } };
      break;
    default:
      orderBy = { createdAt: 'desc' };
      break;
  }

  const skip = (page - 1) * limit;

  const [total, posts] = await Promise.all([
    prisma.communityPost.count({ where }),
    prisma.communityPost.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        user: true,
        trip: {
          include: {
            tripStops: {
              orderBy: { orderIndex: 'asc' },
              include: { city: true },
            },
          },
        },
        likes: {
          select: { userId: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    }),
  ]);

  return {
    posts: posts.map((p) => formatPostResponse(p, currentUserId)),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get detailed community post by ID
 */
const getPostById = async (postId, currentUserId = null) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: {
      user: true,
      trip: {
        include: {
          tripStops: {
            orderBy: { orderIndex: 'asc' },
            include: { city: true },
          },
        },
      },
      likes: {
        select: { userId: true },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });

  if (!post) {
    throw new ApiError(404, 'Community post not found');
  }

  // Enforce privacy rule: Do not expose posts associated with private trips
  if (post.trip && !post.trip.isPublic) {
    throw new ApiError(404, 'Community post not found');
  }

  return formatPostResponse(post, currentUserId);
};

/**
 * Update post content
 */
const updatePost = async (postId, userId, { content }) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new ApiError(404, 'Community post not found');
  }

  if (post.userId !== userId) {
    throw new ApiError(403, 'You can only update your own community posts');
  }

  const updatedPost = await prisma.communityPost.update({
    where: { id: postId },
    data: { content },
    include: {
      user: true,
      trip: {
        include: {
          tripStops: {
            orderBy: { orderIndex: 'asc' },
            include: { city: true },
          },
        },
      },
      likes: {
        select: { userId: true },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });

  return formatPostResponse(updatedPost, userId);
};

/**
 * Delete community post
 */
const deletePost = async (postId, userId) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new ApiError(404, 'Community post not found');
  }

  if (post.userId !== userId) {
    throw new ApiError(403, 'You can only delete your own community posts');
  }

  await prisma.communityPost.delete({
    where: { id: postId },
  });

  return {
    success: true,
    message: 'Community post deleted successfully',
  };
};

/**
 * Like a community post (Prevents duplicate likes via @@unique constraint)
 */
const likePost = async (postId, userId) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new ApiError(404, 'Community post not found');
  }

  await prisma.like.upsert({
    where: {
      userId_communityPostId: {
        userId,
        communityPostId: postId,
      },
    },
    create: {
      userId,
      communityPostId: postId,
    },
    update: {},
  });

  const likesCount = await prisma.like.count({
    where: { communityPostId: postId },
  });

  if (post.userId !== userId) {
    const { createNotification } = require('./notification.service');
    await createNotification(post.userId, {
      title: 'New Like on Your Post',
      message: 'Someone liked your community post.',
      type: 'COMMUNITY_INTERACTION',
    });
  }

  return {
    success: true,
    message: 'Post liked successfully',
    likesCount,
    isLikedByMe: true,
  };
};

/**
 * Unlike a community post
 */
const unlikePost = async (postId, userId) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new ApiError(404, 'Community post not found');
  }

  await prisma.like.deleteMany({
    where: {
      userId,
      communityPostId: postId,
    },
  });

  const likesCount = await prisma.like.count({
    where: { communityPostId: postId },
  });

  return {
    success: true,
    message: 'Post unliked successfully',
    likesCount,
    isLikedByMe: false,
  };
};

/**
 * Get comments for a post
 */
const getComments = async (postId) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new ApiError(404, 'Community post not found');
  }

  const comments = await prisma.comment.findMany({
    where: { communityPostId: postId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
  });

  return comments;
};

/**
 * Add a comment to a post
 */
const addComment = async (postId, userId, { content }) => {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new ApiError(404, 'Community post not found');
  }

  const comment = await prisma.comment.create({
    data: {
      communityPostId: postId,
      userId,
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    },
  });

  if (post.userId !== userId) {
    const { createNotification } = require('./notification.service');
    await createNotification(post.userId, {
      title: 'New Comment on Your Post',
      message: `${comment.user?.firstName || 'A user'} commented: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
      type: 'COMMUNITY_INTERACTION',
    });
  }

  return comment;
};

/**
 * Delete a comment (Author only)
 */
const deleteComment = async (commentId, userId) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.userId !== userId) {
    throw new ApiError(403, 'You can only delete your own comments');
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return {
    success: true,
    message: 'Comment deleted successfully',
  };
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getComments,
  addComment,
  deleteComment,
};
