const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('[MongoDB Error] MONGODB_URI environment variable is missing.');
      throw new Error('MONGODB_URI environment variable is missing on Vercel.');
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected to database: ${conn.connection.name} @ ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Error] Connection failed: ${error.message}`);
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

module.exports = connectDB;
