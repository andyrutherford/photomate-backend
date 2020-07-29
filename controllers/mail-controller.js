const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

exports.requestVerification = async (req, res, next) => {
  try {
    let user = await User.findOne({ email: req.body.email });
    if (!user || user._id.toString() !== req.user.id) {
      return res.status(403).json({
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
        ? `http://localhost:3000/verify/${token}`
        : `${process.env.PRODUCTION_URL}/verify/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Becoming Verified',
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

exports.confirmVerification = async (req, res, next) => {
  const token = req.params.token;
  try {
    let user = await User.findById(req.user.id);
    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: 'You are already verified.',
      });
    }
    if (!user.verifiedToken) {
      return res.status(400).json({
        success: false,
        message: 'You have not requested to become verified.',
      });
    }
    if (user.verifiedToken !== token) {
      return res.status(401).json({
        success: false,
        message:
          'Token wrong or expired.  Please request to become verified again.',
      });
    }

    user.verified = true;
    user.verifiedToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'You are now verified.',
    });
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
};
