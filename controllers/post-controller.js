const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const mongoose = require('mongoose');

const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');

// @desc    Get all posts (Feed)
// @route   GET /api/v1/post/feed
// @access  PRIVATE
exports.getFeed = async (req, res, next) => {
  // TODO: populate saved post status for each post
  const username = req.user.username;

  try {
    let users = await User.find({}).select('username name avatar');
    users = users.filter((user) => user.username !== username);
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    const suggestedUsers = shuffleArray(users).slice(0, 5);

    const feed = await Post.find()
      .select('likeCount likes caption image createdAt')
      .populate({
        path: 'user',
        select: 'username avatar',
      })
      .populate({
        path: 'comments',
        select: 'text',
        populate: {
          path: 'user',
          select: 'username avatar',
        },
      });
    res.status(200).json({
      success: true,
      feed,
      suggestedUsers,
    });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
};

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

// @desc    Get posts by post ID
// @route   GET /api/v1/post/:postId
// @access  PRIVATE
exports.getPostById = async (req, res, next) => {
  const postId = req.params.postId;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid post ID.' });
  }

  try {
    let post = await Post.findById(postId)
      .populate({
        path: 'comments',
        select: 'text',
        populate: {
          path: 'user',
          select: 'username avatar',
        },
      })
      .populate({
        path: 'user',
        select: 'username avatar',
      });
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found.' });
    }

    res.status(200).json({ success: true, post });
  } catch (error) {
    console.log(error.message);
    res.status(500).send(error.message);
  }
};

// @desc    Get posts by User ID
// @route   GET /api/v1/post/user/:username
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
// @route   POST /api/v1/post/new
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
// @route   PUT /api/v1/post/new/image
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

// @desc    Delete post by ID
// @route   DELETE /api/v1/post/:postId
// @access  PRIVATE
exports.deletePostById = async (req, res, next) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid post ID.' });
  }

  try {
    const post = await Post.findById(postId);

    // Make sure post exists
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found.' });
    }

    // Make sure user deleting the post is user that created the post
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post.',
      });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { posts: postId },
      $inc: { postCount: -1 },
    });
    await post.remove();
    res.status(200).json({
      success: true,
      message: 'Post ' + postId + ' has been deleted.',
    });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
};

// @desc    Delete all users posts
// @route   DELETE /api/v1/post/
// @access  PRIVATE
exports.deleteAllUserPosts = async (req, res, next) => {
  try {
    const posts = await Post.deleteMany({
      user: req.user.id,
    });
    let user = await User.findById(req.user.id);
    user.posts = [];
    await user.save();
    res.json({
      success: true,
      user: user.username,
      postsDeleted: posts.deletedCount,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send(error.message);
  }
};

// @desc    Add comment to post
// @route   POST /api/v1/post/:postId/comment
// @access  PRIVATE
exports.addComment = async (req, res, next) => {
  const { postId } = req.params;
  const { text } = req.body;
  const user = req.user.id;

  if (!text) {
    return res
      .status(400)
      .json({ success: false, message: 'A comment is required.' });
  }

  // Ensure proper object id
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid post ID.' });
  }

  try {
    let post = await Post.findById(postId);

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found.' });
    }
    let comment = await Comment.create({
      text,
      user,
      post: postId,
    });

    post.comments.push(comment._id);
    post.commentCount += 1;

    post.save();

    comment = await comment
      .populate({ path: 'user', select: 'avatar username fullname' })
      .execPopulate();

    res.status(201).json({
      sucess: true,
      comment,
    });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
};

// @desc    Delete comment
// @route   DELETE /api/v1/post/:postId/:commentId
// @access  PRIVATE
exports.deleteComment = async (req, res, next) => {
  const userId = req.user.id;
  const { postId, commentId } = req.params;

  if (!postId)
    return res
      .status(400)
      .json({ success: false, message: 'A postId is required.' });

  if (!commentId)
    return res
      .status(400)
      .json({ success: false, message: 'A commentId is required.' });

  // Ensure proper object id
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid post ID.' });
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid comment ID.' });
  }

  try {
    let comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }
    let post = await Post.findById(comment.post);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    if (comment.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment.',
      });
    }
    await comment.remove();
    ``;

    post.comments = post.comments.filter(
      (comment) => comment.toString() !== commentId
    );
    post.commentCount -= 1;

    post.save();

    return res.status(200).json({
      success: true,
      message: 'Comment ' + commentId + ' has been deleted.',
    });
  } catch (error) {
    console.log('error: ', error.message);
    res.send(error.message);
  }
};

// @desc    Like/unlike post
// @route   GET /api/v1/post/:postId/like
// @access  PRIVATE
exports.likePost = async (req, res, next) => {
  const userId = req.user.id;
  const { postId } = req.params;

  // Ensure proper object id
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid post ID.' });
  }

  try {
    let post = await Post.findById(postId).select('likes likeCount');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }
    let action;
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((user) => user.toString() !== userId);
      post.likeCount--;
      action = 'unlike';
    } else {
      post.likes.unshift(userId);
      post.likeCount++;
      action = 'like';
    }

    await post.save();

    res.json({
      success: true,
      message: `You ${action} post ${postId}.`,
      user: userId,
      post,
    });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
};

// @desc    Get users saved posts
// @route   GET /api/v1/post/saved
// @access  PRIVATE
exports.getSavedPosts = async (req, res, next) => {
  const userId = req.user.id;
  try {
    let user = await User.findById(userId).select('username').populate({
      path: 'savedPosts',
      select: 'image likes likeCount commentCount',
    });

    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
};

// @desc    Save/Unsave post
// @route   GET /api/v1/post/:postId/save
// @access  PRIVATE
exports.savePost = async (req, res, next) => {
  const userId = req.user.id;
  const { postId } = req.params;

  // Ensure proper object id
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid post ID.' });
  }

  try {
    let user = await User.findById(userId).select('savedPosts');
    console.log(user);
    if (user.savedPosts.includes(postId)) {
      user.savedPosts = user.savedPosts.filter(
        (post) => postId !== post.toString()
      );
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.send(error.message);
  }
};
