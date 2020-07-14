const express = require('express');
const router = express.Router();

const {
  validateSignup,
  validateLogin,
  ensureDoesntExist,
  ensureExists,
} = require('../middleware/user-validator');
const { signup, login } = require('../controllers/auth-controller');

router.route('/signup').post(validateSignup, ensureDoesntExist, signup);
router.route('/login').post(validateLogin, ensureExists, login);

module.exports = router;
