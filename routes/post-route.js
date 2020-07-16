const express = require('express');
const router = express.Router();

// const {
//   validatePost
// } = require('../middleware/post-validator');
const auth = require('../middleware/auth');
const { createPost } = require('../controllers/post-controller');

router.route('/').post(auth, createPost);

module.exports = router;
