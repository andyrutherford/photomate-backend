const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/user-controller');

router.route('/').get(auth, getProfile);
router.route('/').put(auth, updateProfile);

module.exports = router;
