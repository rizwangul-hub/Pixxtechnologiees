require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { seedInitialManager } = require('./controllers/authController');
const { initCronService } = require('./services/cronService');

const PORT = process.env.PORT || 5001;

function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`[Security Audit] Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (isProduction) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error('❌ CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters in production.');
      process.exit(1);
    }
    if (!process.env.MONGODB_URI) {
      console.error('❌ CRITICAL SECURITY ERROR: MONGODB_URI environment variable is missing.');
      process.exit(1);
    }
  }
}

const startServer = async () => {
  try {
    validateEnvironment();
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Seed initial manager if DB is empty
    await seedInitialManager();

    // 3. Initialize background scheduled cron service for automated rent generator
    initCronService();

    // 4. Start Express HTTP Server
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`  PixxTechnologies Backend API`);
      console.log(`  Running on: http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('[Server Error] Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
