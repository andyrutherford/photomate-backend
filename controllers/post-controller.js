const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const Post = require('../models/Post');

exports.getUserPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ user: req.user.id });
    res.status(200).json({ success: true, posts: posts.reverse() });
  } catch (error) {
    console.log(error.message);
  }
};

// @desc    Create Post
// @route   POST /api/v1/auth/signup
// @access  PUBLIC
exports.createPost = async (req, res, next) => {
  const { imageUrl, caption } = req.body;

  try {
    const post = await new Post({
      user: req.user.id,
      caption,
      image: imageUrl,
    });

    await post.save();

    return res.status(200).json({ success: true, post });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
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

    return res.json({ success: true, image: response.secure_url });
  } catch (err) {
    res.send(err.message);
  }
};
