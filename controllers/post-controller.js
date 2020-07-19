const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// @desc    Create Post
// @route   POST /api/v1/auth/signup
// @access  PUBLIC
exports.createPost = async (req, res, next) => {
  res.json({
    success: true,
    user: req.user.id,
    post: req.body,
  });
};

// @desc    Upload post image
// @route   PUT /api/v1/post/new
// @access  PRIVATE
exports.uploadImage = async (req, res, next) => {
  console.log('uploadImage', req.file);
  if (!req.file) {
    return res.status(400).json({ error: 'An image is required.' });
  }

  try {
    const response = await cloudinary.uploader.upload(req.file.path, {
      width: 614,
    });
    fs.unlinkSync(req.file.path);

    // await User.findOneAndUpdate(
    //   { _id: req.user.id },
    //   { avatar: response.secure_url }
    // );

    return res.json({ success: true, image: response.secure_url });
  } catch (err) {
    res.send(err.message);
  }
};
