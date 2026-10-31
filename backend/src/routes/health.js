/**
 * src/routes/health.js
 *
 * GET /api/health
 *
 * Lightweight endpoint used by Render health checks and local verification.
 * Also verifies the database connection on each call so you can confirm
 * your DATABASE_URL is correctly configured.
 */

'use strict';

const { Router } = require('express');
const prisma = require('../config/prisma');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    // Run a minimal query to confirm the DB connection is alive.
    // $queryRaw is used here so it works even before any migrations are applied.
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      status: 'ok',
      message: 'Brightloop backend is running.',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (dbErr) {
    // Server is up but DB is unreachable — still return 200 so the process
    // doesn't restart, but surface the db error clearly.
    console.error('[Health] Database connection failed:', dbErr.message);
    return res.status(200).json({
      success: true,
      status: 'degraded',
      message: 'Brightloop backend is running but the database is unreachable.',
      database: 'disconnected',
      dbError: dbErr.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  }
});

module.exports = router;

