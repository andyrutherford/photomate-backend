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
      type: Number,
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
