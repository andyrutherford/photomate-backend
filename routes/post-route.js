const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuid_v4 } = require('uuid');

const { validatePost } = require('../middleware/post-validator');
const auth = require('../middleware/auth');
const {
  uploadImage,
  createPost,
  getUserPosts,
  getPostsByUsername,
} = require('../controllers/post-controller');

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
};

router.route('/').get(auth, getUserPosts);
router.route('/:username').get(auth, getPostsByUsername);
router.route('/new').post(auth, createPost);
router.route('/new/image').post(
  auth,
  multer({
    limits: 1000000,
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/images');
      },
      filename: (req, file, cb) => {
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, uuid_v4() + '.' + ext);
      },
    }),
    fileFilter: (req, file, cb) => {
      const isValid = !!MIME_TYPE_MAP[file.mimetype];
      let error = isValid ? null : new Error('Invalid mime type.');
      cb(error, isValid);
    },
  }).single('image'),
  uploadImage
);

module.exports = router;
