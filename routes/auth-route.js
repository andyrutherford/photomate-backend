const express = require('express');
const router = express.Router();

const {
  validateSignup,
  validateLogin,
  ensureDoesntExist,
  ensureExists,
} = require('../middleware/user-validator');
const auth = require('../middleware/auth');
const { signup, login, loadUser } = require('../controllers/auth-controller');

router.route('/').get(auth, loadUser);
router.route('/signup').post(validateSignup, ensureDoesntExist, signup);
router.route('/login').post(validateLogin, ensureExists, login);

module.exports = router;
