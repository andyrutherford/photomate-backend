const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  caption: {
    type: String,
    required: [true, 'A photo caption is required'],
  },
  image: {
    type: String,
  },
  likes: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  likeCount: {
    type: Number,
    default: 0,
  },
  comments: [{ type: mongoose.Schema.ObjectId, ref: 'Comment' }],
  commentCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Post', PostSchema);
