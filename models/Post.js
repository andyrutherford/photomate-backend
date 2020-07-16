const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
    required: true,
  },
  caption: {
    type: String,
    required: [true, 'A photo caption is required'],
  },
  image: {
    type: String,
  },
  likes: {
    type: [String],
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  comments: {
    type: [String],
  },
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
