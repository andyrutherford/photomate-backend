// const User = require('../models/User');

// @desc    Create Post
// @route   POST /api/v1/auth/signup
// @access  PUBLIC
exports.createPost = async (req, res, next) => {
  res.json({
    success: true,
    user: req.user.id,
    post: req.body,
  });
};
