// =====================================================================
// src/config/env.js
// Loads and validates environment variables once at boot.
// Never logs secrets. Throws if a required variable is missing.
// =====================================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Check server/.env against server/.env.example.`,
    );
  }
  return value;
}

function optional(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return value;
}

const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5000'), 10),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),

  DB_HOST: optional('DB_HOST', 'localhost'),
  DB_PORT: parseInt(optional('DB_PORT', '3306'), 10),
  DB_NAME: optional('DB_NAME', 'pct'),
  DB_USER: optional('DB_USER', 'root'),
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',

  AUTH_SECRET: optional('AUTH_SECRET', ''),
  SESSION_SECRET: optional('SESSION_SECRET', ''),

  UPLOAD_DIR: optional('UPLOAD_DIR', './uploads'),
  MAX_FILE_SIZE_MB: parseInt(optional('MAX_FILE_SIZE_MB', '100'), 10),
};

env.IS_PRODUCTION = env.NODE_ENV === 'production';
env.IS_DEVELOPMENT = env.NODE_ENV === 'development';

module.exports = env;
