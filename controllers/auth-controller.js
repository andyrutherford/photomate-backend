const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res, next) => {
  const { email, name, username, password } = req.body;
  try {
    let user = new User({
      email,
      name,
      username,
      password,
    });

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = {
      user: {
        email: user.email,
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: 360000,
      },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          success: true,
          email,
          token,
        });
      }
    );
  } catch (err) {
    console.log(err.message);
  }
};
