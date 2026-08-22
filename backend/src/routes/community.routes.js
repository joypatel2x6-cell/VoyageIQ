const express = require('express');
const communityController = require('../controllers/community.controller');
const validate = require('../middleware/validate');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  getPostsQuerySchema,
  postIdParamSchema,
  commentIdParamSchema,
} = require('../validators/community.validator');

const router = express.Router();

/**
 * @route   GET /api/v1/community/posts
 * @desc    Get public community posts with filters (search, destination, budget, travelStyle) & sorting
 * @access  Public (Optional Authentication to detect isLikedByMe)
 */
router.get('/posts', optionalAuth, validate(getPostsQuerySchema, 'query'), communityController.getPosts);

/**
 * @route   GET /api/v1/community/posts/:postId
 * @desc    Get detailed community post by ID
 * @access  Public (Optional Authentication to detect isLikedByMe)
 */
router.get('/posts/:postId', optionalAuth, validate(postIdParamSchema, 'params'), communityController.getPostById);

/**
 * @route   POST /api/v1/community/posts
 * @desc    Publish a new community post for a trip (marks trip as public automatically)
 * @access  Private (Trip owner only)
 */
router.post('/posts', requireAuth, validate(createPostSchema), communityController.createPost);

/**
 * @route   PATCH /api/v1/community/posts/:postId
 * @desc    Update an existing community post
 * @access  Private (Post author only)
 */
router.patch(
  '/posts/:postId',
  requireAuth,
  validate(postIdParamSchema, 'params'),
  validate(updatePostSchema),
  communityController.updatePost
);

/**
 * @route   DELETE /api/v1/community/posts/:postId
 * @desc    Delete a community post
 * @access  Private (Post author only)
 */
router.delete('/posts/:postId', requireAuth, validate(postIdParamSchema, 'params'), communityController.deletePost);

/**
 * @route   POST /api/v1/community/posts/:postId/like
 * @desc    Like a community post
 * @access  Private
 */
router.post('/posts/:postId/like', requireAuth, validate(postIdParamSchema, 'params'), communityController.likePost);

/**
 * @route   DELETE /api/v1/community/posts/:postId/like
 * @desc    Unlike a community post
 * @access  Private
 */
router.delete(
  '/posts/:postId/like',
  requireAuth,
  validate(postIdParamSchema, 'params'),
  communityController.unlikePost
);

/**
 * @route   GET /api/v1/community/posts/:postId/comments
 * @desc    Get comments for a community post
 * @access  Public
 */
router.get(
  '/posts/:postId/comments',
  validate(postIdParamSchema, 'params'),
  communityController.getComments
);

/**
 * @route   POST /api/v1/community/posts/:postId/comments
 * @desc    Add a comment to a community post
 * @access  Private
 */
router.post(
  '/posts/:postId/comments',
  requireAuth,
  validate(postIdParamSchema, 'params'),
  validate(createCommentSchema),
  communityController.addComment
);

/**
 * @route   DELETE /api/v1/community/comments/:commentId
 * @desc    Delete a comment
 * @access  Private (Comment author only)
 */
router.delete(
  '/comments/:commentId',
  requireAuth,
  validate(commentIdParamSchema, 'params'),
  communityController.deleteComment
);

module.exports = router;
