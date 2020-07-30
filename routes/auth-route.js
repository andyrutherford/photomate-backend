const express = require('express');
const router = express.Router();

const {
  validateSignup,
  validateLogin,
  ensureDoesntExist,
  ensureExists,
} = require('../middleware/user-validator');
const auth = require('../middleware/auth');
const {
  signup,
  login,
  changePassword,
  loadUser,
  githubAuth,
} = require('../controllers/auth-controller');

router.route('/').get(auth, loadUser);
router.route('/').put(auth, changePassword);
router.route('/signup').post(validateSignup, ensureDoesntExist, signup);
router.route('/login').post(validateLogin, ensureExists, login);
router.route('/github').post(githubAuth);

module.exports = router;
