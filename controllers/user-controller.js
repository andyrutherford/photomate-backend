const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Post = require('../models/Post');
const HttpError = require('../models/HttpError');

// @desc    Get user profile
// @route   GET /api/v1/user
// @access  PRIVATE
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json(user);
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
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
    })
      .select(
        'profile email name username avatar posts followerCount followingCount verified'
      )
      .populate({
        path: 'following',
        select: 'username avatar name',
      })
      .populate({
        path: 'followers',
        select: 'username avatar name',
      });

    if (!user) {
      const error = new HttpError('User not found.', 404);
      return next(error);
    }
    const youAreFollowing = user.followers
      .map((u) => u._id)
      .includes(req.user.id);
    return res.status(200).json({
      success: true,
      youAreFollowing,
      user,
    });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
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
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/user
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
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

// @desc    Update user avatar
// @route   PUT /api/v1/user/avatar
// @access  PRIVATE
exports.updateAvatar = async (req, res, next) => {
  if (!req.file) {
    const error = new HttpError('An image is required.', 400);
    return next(error);
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
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/user
// @access  PRIVATE
exports.deleteUser = async (req, res, next) => {
  // Delete user object
  // Delete all user photos
  // Leave all user comments
  const userId = req.user.id;
  try {
    let user = await User.findById(userId);
    if (!user) {
      const error = new HttpError('User not found', 404);
      return next(error);
    }
    const posts = await Post.deleteMany({
      user: req.user.id,
    });

    await user.remove();

    res.status(200).json({
      success: true,
      message: `User ${user.username} and ${posts.deletedCount} posts have been deleted.`,
    });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

// @desc    Get suggested users
// @route   GET /api/v1/user/suggested
// @access  PRIVATE
exports.getSuggestedUsers = async (req, res, next) => {
  const username = req.user.username;
  try {
    let users = await User.find({}).select('username name avatar ');
    users = users.filter((user) => user.username !== username);
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    const suggestedUsers = shuffleArray(users).slice(0, 5);
    res.json({ success: true, suggestedUsers });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

// @desc    Follow user
// @route   GET /api/v1/user/follow/:username
// @access  PRIVATE
exports.followUser = async (req, res, next) => {
  const username = req.params.username;
  try {
    // Ensure user is not trying to follow themself
    let requestingUser = await User.findById(req.user.id);
    let userToFollow = await User.findOne({ username });
    if (!userToFollow) {
      const error = new HttpError('User does not exist.', 404);
      return next(error);
    }
    if (requestingUser.username === userToFollow.username) {
      const error = new HttpError('You cannot follow yourself.', 403);
      return next(error);
    }

    let action;
    let type;
    // If user is already being followed, then unfollow
    if (requestingUser.following.includes(userToFollow._id.toString())) {
      requestingUser.following = requestingUser.following.filter(
        (user) => user.toString() !== userToFollow._id.toString()
      );
      requestingUser.followingCount--;

      userToFollow.followers = userToFollow.followers.filter(
        (user) => user.toString() !== requestingUser._id.toString()
      );
      userToFollow.followerCount--;
      action = 'unfollowed';
      type = 'unfollow';
    } else {
      requestingUser.following.push(userToFollow._id.toString());
      requestingUser.followingCount++;

      userToFollow.followers.push(requestingUser._id.toString());
      userToFollow.followerCount++;
      action = 'are now following';
      type = 'follow';
    }

    await userToFollow.save();
    await requestingUser.save();
    res.status(200).json({
      success: true,
      type,
      message: `You are now ${action} ${userToFollow.username}.`,
      requestingUser,
    });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

exports.resetFollowerFollowing = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id).select('-password');
    user.followers = [];
    user.following = [];
    user.followerCount = 0;
    user.followingCount = 0;
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

// @desc    Request reset password
// @route   GET /api/v1/user/reset-password
// @access  PUBLIC
exports.requestResetPassword = async (req, res, next) => {
  if (!req.query) {
    const error = new HttpError(
      'This link is either broken or expired.  Please try again in a few minutes.',
      400
    );
    return next(error);
  }
  const token = req.query.token;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
    });
    if (!user) {
      const error = new HttpError(
        'This link is either broken or expired.  Please try again in a few minutes.',
        404
      );
      return next(error);
    }
    return res.status(200).json({
      success: true,
      user: user.email,
      message: 'Please reset your password.',
    });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

// @desc    Reset password
// @route   POST /api/v1/user/reset-password
// @access  PUBLIC
exports.resetPassword = async (req, res, next) => {
  const { token, password } = req.body;
  if (!token || !password) {
    const error = new HttpError('A token and password are required.', 400);
    return next(error);
  }
  if (password.length < 6) {
    const error = new HttpError(
      'The password must be at least 6 characters.',
      400
    );
    return next(error);
  }
  try {
    let user = await User.findOne({
      resetPasswordToken: token,
    });
    if (!user) {
      const error = new HttpError('User not found.', 404);
      return next(error);
    }
    if (user.githubId) {
      const error = new HttpError(
        'The password cannot be reset because this account is connected with Github.',
        403
      );
      return next(error);
    }

    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(password, salt);

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message:
        'Reset password successful.  You may now log in with your new password.',
    });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};
