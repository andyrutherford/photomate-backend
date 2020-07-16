const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/v1/user
// @access  PRIVATE
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    console.log(error.message);
  }
};

// @desc    Update user profile
// @route   GET /api/v1/user
// @access  PRIVATE
exports.updateProfile = async (req, res, next) => {
  const { website, bio, phoneNumber, gender } = req.body;
  const profile = {
    website: website || '',
    bio: bio || '',
    phoneNumber: phoneNumber || null,
    gender: gender || '',
  };
  try {
    let user = await User.findById(req.user.id);
    user.profile = profile;
    await user.save();
    res.send(user);
  } catch (error) {
    console.log(error.message);
  }
};
