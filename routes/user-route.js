const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const { getProfile } = require('../controllers/user-controller');

router.route('/').get(auth, getProfile);

module.exports = router;
