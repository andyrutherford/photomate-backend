const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`.red);
    process.exit(1);
  }
};

module.exports = connectDB;
