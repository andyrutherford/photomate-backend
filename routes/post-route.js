const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuid_v4 } = require('uuid');

const { validatePost } = require('../middleware/post-validator');
const auth = require('../middleware/auth');
const {
  uploadImage,
  createPost,
  getFeed,
  getUserPosts,
  getPostsByUsername,
  deleteAllUserPosts,
  deletePostById,
  getPostById,
  addComment,
  deleteComment,
  likePost,
} = require('../controllers/post-controller');

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
};

router.route('/').get(auth, getUserPosts);
router.route('/feed').get(auth, getFeed);
router.route('/:postId').get(auth, getPostById);
router.route('/:postId').delete(auth, deletePostById);
router.route('/').delete(auth, deleteAllUserPosts);
router.route('/user/:username').get(auth, getPostsByUsername);
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

// Like/unlike
router.route('/:postId/like').get(auth, likePost);

// Comments
router.route('/:postId/comment').post(auth, addComment);
router.route('/:postId/comment/:commentId').delete(auth, deleteComment);

module.exports = router;
