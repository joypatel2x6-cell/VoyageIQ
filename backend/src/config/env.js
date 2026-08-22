const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
};

// Basic runtime validation for critical variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.warn(`[WARNING] Missing environment variable: ${varName}. Using fallback/default if available.`);
  }
});

module.exports = config;
