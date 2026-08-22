const communityService = require('../services/community.service');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/v1/community/posts
 * Get public community posts with filters, search, sorting & pagination
 */
const getPosts = asyncHandler(async (req, res) => {
  const currentUserId = req.user ? req.user.id : null;
  const result = await communityService.getPosts(req.query, currentUserId);
  res.status(200).json({
    success: true,
    message: 'Community posts retrieved successfully',
    data: result.posts,
    pagination: result.pagination,
  });
});

/**
 * GET /api/v1/community/posts/:postId
 * Get detailed community post by ID
 */
const getPostById = asyncHandler(async (req, res) => {
  const currentUserId = req.user ? req.user.id : null;
  const post = await communityService.getPostById(req.params.postId, currentUserId);
  res.status(200).json({
    success: true,
    message: 'Community post details retrieved successfully',
    post,
  });
});

/**
 * POST /api/v1/community/posts
 * Create & publish a new community post
 */
const createPost = asyncHandler(async (req, res) => {
  const post = await communityService.createPost(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Community post published successfully',
    post,
  });
});

/**
 * PATCH /api/v1/community/posts/:postId
 * Update an existing community post
 */
const updatePost = asyncHandler(async (req, res) => {
  const updatedPost = await communityService.updatePost(
    req.params.postId,
    req.user.id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: 'Community post updated successfully',
    post: updatedPost,
  });
});

/**
 * DELETE /api/v1/community/posts/:postId
 * Delete a community post
 */
const deletePost = asyncHandler(async (req, res) => {
  const result = await communityService.deletePost(req.params.postId, req.user.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * POST /api/v1/community/posts/:postId/like
 * Like a community post
 */
const likePost = asyncHandler(async (req, res) => {
  const result = await communityService.likePost(req.params.postId, req.user.id);
  res.status(200).json({
    success: true,
    message: result.message,
    likesCount: result.likesCount,
    isLikedByMe: result.isLikedByMe,
  });
});

/**
 * DELETE /api/v1/community/posts/:postId/like
 * Unlike a community post
 */
const unlikePost = asyncHandler(async (req, res) => {
  const result = await communityService.unlikePost(req.params.postId, req.user.id);
  res.status(200).json({
    success: true,
    message: result.message,
    likesCount: result.likesCount,
    isLikedByMe: result.isLikedByMe,
  });
});

/**
 * GET /api/v1/community/posts/:postId/comments
 * Get comments for a community post
 */
const getComments = asyncHandler(async (req, res) => {
  const comments = await communityService.getComments(req.params.postId);
  res.status(200).json({
    success: true,
    message: 'Post comments retrieved successfully',
    comments,
  });
});

/**
 * POST /api/v1/community/posts/:postId/comments
 * Add a comment to a community post
 */
const addComment = asyncHandler(async (req, res) => {
  const comment = await communityService.addComment(
    req.params.postId,
    req.user.id,
    req.body
  );
  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    comment,
  });
});

/**
 * DELETE /api/v1/community/comments/:commentId
 * Delete a comment
 */
const deleteComment = asyncHandler(async (req, res) => {
  const result = await communityService.deleteComment(req.params.commentId, req.user.id);
  res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getComments,
  addComment,
  deleteComment,
};
