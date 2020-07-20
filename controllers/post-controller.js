const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const Post = require('../models/Post');
const User = require('../models/User');

// @desc    Get user posts
// @route   GET /api/v1/post
// @access  PRIVATE
exports.getUserPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ user: req.user.id });
    res
      .status(200)
      .json({ success: true, user: req.user.username, posts: posts.reverse() });
  } catch (error) {
    console.log(error.message);
  }
};

// @desc    Get posts by User ID
// @route   GET /api/v1/post/:userId
// @access  PRIVATE

exports.getPostsByUsername = async (req, res, next) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.send('User doesnt exist');
    }
    const posts = await Post.find({ user: user._id });
    res
      .status(200)
      .json({ success: true, user: username, posts: posts.reverse() });
  } catch (error) {
    res.send(error.message);
  }
};

// @desc    Create Post
// @route   POST /api/v1/auth/signup
// @access  PUBLIC
exports.createPost = async (req, res, next) => {
  const { imageUrl, caption } = req.body;

  try {
    let post = await Post.create({
      caption,
      image: imageUrl,
      user: req.user.id,
    });
    await User.findByIdAndUpdate(req.user.id, {
      $push: { posts: post._id },
      $inc: { postCount: 1 },
    });

    return res.status(201).json({ success: true, post });
  } catch (error) {
    console.log(error.message);
    res.status(500).send(error.message);
  }

  res.json({
    success: true,
    user: req.user.id,
    imageUrl,
    caption,
  });
};

// @desc    Upload post image
// @route   PUT /api/v1/post/new
// @access  PRIVATE
exports.uploadImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'An image is required.' });
  }

  try {
    const response = await cloudinary.uploader.upload(req.file.path, {
      width: 614,
    });
    fs.unlinkSync(req.file.path);

    return res.status(200).json({ success: true, image: response.secure_url });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
