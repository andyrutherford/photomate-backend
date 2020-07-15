const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/v1/auth
// @access  PRIVATE
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    console.log(error.message);
  }
};
