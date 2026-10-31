/**
 * src/config/env.js
 *
 * Centralises all environment-variable access.
 * The app fails fast at startup if a critical variable is missing,
 * rather than crashing at runtime in a hard-to-debug way.
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Read a required env var; throw a clear error if it is absent.
 * @param {string} key
 * @returns {string}
 */
function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: "${key}". ` +
        'Please copy .env.example to .env and fill in all values.'
    );
  }
  return value;
}

/**
 * Read an optional env var with a fallback default.
 * @param {string} key
 * @param {string} defaultValue
 * @returns {string}
 */
function optional(key, defaultValue) {
  return process.env[key] || defaultValue;
}

// ── Exported Config ───────────────────────────────────────────────────────────

const config = {
  // Server
  nodeEnv: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '5000'), 10),

  // Database — required; app will not start without a valid DATABASE_URL
  databaseUrl: required('DATABASE_URL'),

  // JWT
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),

  // CORS — parse comma-separated origins into an array
  corsOrigins: optional('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim()),

  // Rate Limiting
  rateLimitWindowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  rateLimitMax: parseInt(optional('RATE_LIMIT_MAX', '100'), 10),

  // Convenience flags
  isDev: optional('NODE_ENV', 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

module.exports = config;

