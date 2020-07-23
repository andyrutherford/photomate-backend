const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuid_v4 } = require('uuid');

const auth = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getUserById,
  updateAvatar,
  deleteUser,
  getSuggestedUsers,
  followUser,
} = require('../controllers/user-controller');

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
};

router.route('/').get(auth, getProfile);
router.route('/').put(auth, updateProfile);
router.route('/').delete(auth, deleteUser);
router.route('/suggested').get(auth, getSuggestedUsers);
router.route('/follow/:username').get(auth, followUser);
router.route('/:username').get(auth, getUserById);
router.route('/avatar').put(
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
  updateAvatar
);

module.exports = router;
