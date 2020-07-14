const express = require('express');
const router = express.Router();

const {
  validateUser,
  ensureDoesntExist,
} = require('../middleware/user-validator');
const { signup } = require('../controllers/auth-controller');

router.route('/').post(validateUser, ensureDoesntExist, signup);

module.exports = router;
