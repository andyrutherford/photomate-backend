const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Signup user
// @route   POST /api/v1/auth/signup
// @access  PUBLIC
exports.signup = async (req, res, next) => {
  const { email, name, username, password } = req.body;
  try {
    let user = new User({
      email,
      name,
      username,
      password,
    });

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = {
      user: {
        email: user.email,
        username: user.username,
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: 360000,
      },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          success: true,
          email,
          username,
          token,
        });
      }
    );
  } catch (error) {
    console.log(error.message);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  PUBLIC
exports.login = async (req, res, next) => {
  const { userID, password } = req.body;

  try {
    //   Log in with email
    let user = await User.findOne({ email: userID });
    if (!user) {
      // Log in with username
      user = await User.findOne({ username: userID });
      if (!user) {
        res.status(500).send('Server Error');
      }
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials.  Please try again.',
      });
    }
    //   Generate new JWT payload
    const payload = {
      user: {
        email: user.email,
        username: user.username,
        id: user.id,
      },
    };

    // Sign JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({
          success: true,
          email: user.email,
          username: user.username,
          token,
        });
      }
    );
  } catch (error) {
    console.log(error.message);
  }
};

// @desc    Load user
// @route   GET /api/v1/auth
// @access  PRIVATE
exports.loadUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    });
  } catch (error) {
    console.log(error.message);
  }
};
