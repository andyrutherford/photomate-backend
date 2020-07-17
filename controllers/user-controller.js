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

// @desc    Get User by ID
// @route   GET /api/v1/user/:username
// @access  PUBLIC
exports.getUserById = async (req, res, next) => {
  console.log(req.body);
  const { username } = req.params;
  console.log(username);
  try {
    let user = await User.findOne({
      username,
    }).select('profile email name username avatar');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error.message);
  }
};

// @desc    Update user profile
// @route   GET /api/v1/user
// @access  PRIVATE
exports.updateProfile = async (req, res, next) => {
  console.log(req.body);
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
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error.message);
  }
};

// @desc    Update user profile
// @route   GET /api/v1/user
// @access  PUBLIC
exports.updateProfile = async (req, res, next) => {
  console.log(req.body);
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
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error.message);
  }
};
