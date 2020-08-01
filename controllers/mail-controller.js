const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

const HttpError = require('../models/HttpError');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
        console.error(err);
      } else {
        res
          .status(200)
          .json({ success: true, message: 'Verification email sent.' });
      }
    });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

exports.confirmVerification = async (req, res, next) => {
  const token = req.params.token;
  try {
    let user = await User.findById(req.user.id);
    if (user.verified) {
      const error = new HttpError('You are already verified.', 400);
      return next(error);
    }
    if (!user.verifiedToken) {
      const error = new HttpError(
        'You have not requested to become verified.',
        400
      );
      return next(error);
    }
    if (user.verifiedToken !== token) {
      const error = new HttpError(
        'Token is wrong or expired.  Please request to become verified again.',
        401
      );
      return next(error);
    }

    user.verified = true;
    user.verifiedToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'You are now verified.',
    });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  if (!req.body.email) {
    const error = new HttpError('An email address is required.', 400);
    return next(error);
  }
  try {
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      const error = new HttpError('A user with that email was not found.', 404);
      return next(error);
    }
    if (user.githubId) {
      const error = new HttpError(
        'The password cannot be reset because this account is connected with Github.',
        403
      );
      return next(error);
    }
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;

    await user.save();

    const mailURL =
      process.env.NODE_ENV === 'development'
        ? `http://localhost:3000/reset-password/${token}`
        : `${process.env.PRODUCTION_URL}/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Becoming Verified',
      text:
        `You are receiving this message because you requested the reset of the password for your account.\n\n` +
        `Please click on the following link, or paste it into your browser:\n\n` +
        `${mailURL} \n\n` +
        `If you did not request this, please ignore this email.\n`,
    };

    transporter.sendMail(mailOptions, (err, response) => {
      if (err) {
        console.error('error: ', err);
      } else {
        res.status(200).json({
          success: true,
          message: `Reset password email sent to ${req.body.email}`,
        });
      }
    });
  } catch (err) {
    const error = new HttpError(err.message, 500);
    return next(error);
  }
};
