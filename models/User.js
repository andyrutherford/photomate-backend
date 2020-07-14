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
  website: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
  },
  phoneNumber: {
    type: Number,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
