const { check, validationResult } = require('express-validator');

exports.validatePost = [
  check('user')
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage('Post must have a user')
    .bail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });
    next();
  },
];
