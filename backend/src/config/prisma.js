/**
 * src/config/prisma.js
 *
 * Exports a single shared PrismaClient instance.
 * Re-using one instance avoids exhausting the PostgreSQL connection pool.
 * In development, the instance is stored on `global` to survive hot-reloads.
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const config = require('./env');

// Prevent multiple PrismaClient instances during development hot-reloads
let prisma;

if (config.isDev) {
  // Store on global so nodemon restarts don't create a new pool each time
  if (!global._prisma) {
    global._prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global._prisma;
} else {
  prisma = new PrismaClient({
    log: ['warn', 'error'],
  });
}

module.exports = prisma;

