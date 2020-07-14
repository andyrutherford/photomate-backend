const User = require('../models/User');
const { check, validationResult } = require('express-validator');

exports.validateSignup = [
  check('username')
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage('Username cannot be empty')
    .bail()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .bail(),
  check('name')
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage('Name cannot be empty')
    .bail(),
  check('email')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Email cannot be empty')
    .bail()
    .isEmail()
    .withMessage('Invalid email')
    .bail(),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password cannot be empty')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .bail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });
    next();
  },
];

// The userID can either be a username or an email
exports.validateLogin = [
  check('userID')
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage('Username or email cannot be empty')
    .bail()
    .bail(),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password cannot be empty')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .bail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });
    next();
  },
];

exports.ensureDoesntExist = async (req, res, next) => {
  const emailExists = await User.findOne({ email: req.body.email });
  const usernameExists = await User.findOne({ username: req.body.username });

  if (emailExists) {
    return res.status(422).json({
      success: false,
      message: 'The email already exists',
    });
  } else if (usernameExists) {
    return res.status(422).json({
      success: false,
      message: 'The username already exists',
    });
  } else return next();
};

exports.ensureExists = async (req, res, next) => {
  const emailExists = await User.findOne({ email: req.body.userID });
  const usernameExists = await User.findOne({ username: req.body.userID });

  if (!emailExists && !usernameExists) {
    return res.status(400).json({
      success: false,
      message: 'Username or email not found.  Please create an account.',
    });
  } else return next();
};
