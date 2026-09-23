const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('Missing MONGO_URI. Create a .env file in the backend folder and set MONGO_URI (copy from .env.example).');
    process.exit(1);
  }
  try {
    // Only override dbName for development to use 'nestory' database
    // For testing, let the MONGO_URI specify the database (e.g., /test)
    const options = {};
    if (process.env.NODE_ENV === 'development') {
      options.dbName = 'nestory';
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
