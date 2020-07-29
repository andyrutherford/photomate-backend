const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

exports.verifyUser = async (req, res, next) => {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (!user || user._id.toString() !== req.user.id) {
      res.status(404).json({
        success: false,
        message: 'The email address is incorrect.',
      });
    }
    const token = crypto.randomBytes(20).toString('hex');
    user.verifiedToken = token;

    await user.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailURL =
      process.env.NODE_ENV === 'development'
        ? `http://localhost:3000/get-verified/${token}`
        : `${process.env.PRODUCTION_URL}/reset_password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Become Verified',
      text:
        `You are receiving this message because you requested user verification on the account associated with this email.\n\n` +
        `Please click on the following link, or paste it into your browser to become verified:\n\n` +
        `${mailURL} \n\n` +
        `If you did not request this, please ignore this email.\n`,
    };

    transporter.sendMail(mailOptions, (err, response) => {
      if (err) {
        console.error('error: ', err);
      } else {
        res
          .status(200)
          .json({ success: true, message: 'Verification email sent.' });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
};
