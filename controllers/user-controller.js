const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const User = require('../models/User');
const Post = require('../models/Post');

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
  const { username } = req.params;
  try {
    let user = await User.findOne({
      username,
    }).select('profile email name username avatar posts followers following');

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'User not found.',
      });
    } else
      return res.status(200).json({
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

// @desc    Update user avatar
// @route   PUT /api/v1/user/avatar
// @access  PRIVATE
exports.updateAvatar = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'An image is required.' });
  }

  try {
    const response = await cloudinary.uploader.upload(req.file.path, {
      width: 200,
      height: 200,
      gravity: 'face',
      crop: 'thumb',
    });
    fs.unlinkSync(req.file.path);

    await User.findOneAndUpdate(
      { _id: req.user.id },
      { avatar: response.secure_url }
    );

    return res.json({ success: true, avatar: response.secure_url });
  } catch (err) {
    res.send(err.message);
  }
};

// @desc    Delete user
// @route   Delete /api/v1/user
// @access  PRIVATE
exports.deleteUser = async (req, res, next) => {
  // Delete user object
  // Delete all user photos
  // Leave all user comments
  const userId = req.user.id;
  try {
    let user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }
    const posts = await Post.deleteMany({
      user: req.user.id,
    });

    await user.remove();

    res.status(200).json({
      success: true,
      message: `User ${user.username} and ${posts.deletedCount} posts have been deleted.`,
    });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
};
