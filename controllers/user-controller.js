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
      res.status(400).json({
        success: false,
        message: 'User not found.',
      });
    }
    let youAreFollowing = false;
    if (
      user.followers.length > 0 &&
      user.followers.filter((u) => u.username === req.user.username)
    ) {
      youAreFollowing = true;
    }
    return res.status(200).json({
      success: true,
      youAreFollowing,
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
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
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
      return res.status(404).json({
        success: false,
        message: 'User does not exist.',
      });
    }
    if (requestingUser.username === userToFollow.username) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself.',
      });
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
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
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
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
};

// @desc    Request reset password
// @route   GET /api/v1/user/reset-password
// @access  PUBLIC
exports.requestResetPassword = async (req, res, next) => {
  console.log(req.query);
  if (!req.query) {
    return res.status(400).json({
      success: false,
      message:
        'This link is either broken or expired.  Please try again later.',
    });
  }
  const token = req.query.token;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'This link is either broken or expired.  Please try again later.',
      });
    }
    return res.status(200).json({
      success: true,
      user: user.email,
      message: 'Please reset your password.',
    });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
};

// @desc    Reset password
// @route   POST /api/v1/user/reset-password
// @access  PUBLIC
exports.resetPassword = async (req, res, next) => {};
