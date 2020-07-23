const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    trim: true,
    required: [true, 'Username is required'],
    unique: true,
  },
  name: {
    type: String,
    trim: true,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    trim: true,
    required: [true, 'Email is required'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  avatar: {
    type: String,
    default:
      'https://res.cloudinary.com/dec2xrpad/image/upload/v1594949863/avatar.png',
  },
  posts: [{ type: mongoose.Schema.ObjectId, ref: 'Post' }],
  followerCount: {
    type: Number,
    default: 0,
  },
  followers: [{ type: mongoose.Schema.ObjectId, ref: 'User ' }],
  followingCount: {
    type: Number,
    default: 0,
  },
  following: [{ type: mongoose.Schema.ObjectId, ref: 'User ' }],
  profile: {
    website: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    gender: {
      type: String,
      enum: ['', 'male', 'female', 'other'],
      default: '',
    },
  },
});

module.exports = mongoose.model('User', UserSchema);
