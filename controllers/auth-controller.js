const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const HttpError = require('../models/HttpError');

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
        const error = new HttpError(
          'A problem occurred.  Please try again later.',
          500
        );
        return next(error);
      }
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      const error = new HttpError(
        'Invalid credentials.  Please try again.',
        401
      );
      return next(error);
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
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

// @desc    Change password
// @route   PUT /api/v1/auth
// @access  PRIVATE
exports.changePassword = async (req, res, next) => {
  if (!req.body.oldPassword || !req.body.newPassword) {
    const error = new HttpError(
      'The old password and new password are required',
      400
    );
    return next(error);
  }
  try {
    let user = await User.findById(req.user.id);
    if (user.githubId) {
      const error = new HttpError(
        'The password cannot be changed because this account is connected with Github.',
        400
      );
      return next(error);
    }

    const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!isMatch) {
      const error = new HttpError('Your old password is incorrect.', 400);
      return next(error);
    }
    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(req.body.newPassword, salt);

    user.password = newPassword;

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
        res.status(200).json({
          success: true,
          email: req.user.email,
          username: req.user.username,
          token,
        });
      }
    );
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
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
  } catch (err) {
    const error = new HttpError('Server error', 500);
    return next(error);
  }
};

// @desc    Authenticate with Github
// @route   GET /api/v1/auth/github
// @access  PUBLIC
exports.githubAuth = async (req, res, next) => {
  const { code, state } = req.body;
  if (!state || !code) {
    const error = new HttpError('Code and state are required.', 400);
    return next(error);
  }
  try {
    const github = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        state,
      }
    );
    const accessToken = github.data.split('=')[1].split('&')[0];

    // Get users github profile
    const githubUser = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` },
    });

    // Get users github email
    const githubEmails = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `token ${accessToken}` },
    });
    const primaryEmail = githubEmails.data.filter(
      (email) => email.primary === true
    )[0].email;

    const user = await User.findOne({ githubId: githubUser.data.id });
    if (user) {
      //   Generate new JWT payload
      const payload = {
        user: {
          email: user.email,
          username: user.username,
          id: user.id,
        },
      };
      // Sign JWT
      return jwt.sign(
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
    }

    const userExists = await User.findOne({
      $or: [{ email: primaryEmail }, { username: githubUser.data.login }],
    });
    if (userExists) {
      const error = new HttpError(
        'A user with this email or username already exists.',
        400
      );
      return next(error);
    }

    const newUser = new User({
      email: primaryEmail,
      name: githubUser.data.name,
      username: githubUser.data.login,
      githubId: githubUser.data.id,
      avatar: githubUser.data.avatar_url,
    });

    await newUser.save();

    //   Generate new JWT payload
    const payload = {
      user: {
        email: newUser.email,
        username: newUser.username,
        id: newUser.id,
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
          email: newUser.email,
          username: newUser.username,
          token,
        });
      }
    );
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};
