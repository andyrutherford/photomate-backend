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

const app = express();

// CORS
app.use(cors());

// Body parser
app.use(express.json());

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/v1/auth', auth);
app.use('/api/v1/user', user);
app.use('/api/v1/post', post);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} on port ${PORT}`)
);
