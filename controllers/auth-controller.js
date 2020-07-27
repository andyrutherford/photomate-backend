const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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
      return res.status(401).json({
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
    res.status(500).send('Server error');
    console.log(error.message);
  }
};

// @desc    Authenticated with Github
// @route   GET /api/v1/auth/github
// @access  PUBLIC
exports.githubAuth = async (req, res, next) => {
  const { code, state } = req.body;
  if (!state || !code) {
    return res.status(400).send('A code and state is required');
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
    console.log(github.data);
    const accessToken = github.data.split('=')[1].split('&')[0];
    console.log(accessToken);

    // Get users github profile
    const githubUser = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` },
    });

    console.log(githubUser.data);

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
      return res.send('A user with this email or username already exists');
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
  } catch (error) {
    console.log(error.message);
    res.send('Auth error');
  }
};
