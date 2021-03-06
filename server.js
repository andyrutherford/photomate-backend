const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');

const connectDB = require('./config/db');

dotenv.config({ path: './config/config.env' });

connectDB();

const auth = require('./routes/auth-route');
const user = require('./routes/user-route');
const post = require('./routes/post-route');
const mail = require('./routes/mail-route');

const app = express();

// CORS
app.use(cors());

// Body parser
app.use(bodyParser.json());
app.use(require('body-parser').urlencoded({ extended: true }));

// Serve images statically
app.use('/uploads/images', express.static(path.join('uploads', 'images')));

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/v1/auth', auth);
app.use('/api/v1/user', user);
app.use('/api/v1/post', post);
app.use('/api/v1/mail', mail);

// Error handling middleware
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (error) => {
      console.log(error);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500).json({
    success: error.success,
    message: error.message || 'An unknown error occurred.',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} on port ${PORT}`)
);
