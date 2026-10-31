/**
 * server.js
 *
 * Entry point — binds the Express app to a TCP port.
 * Handles graceful shutdown on SIGTERM/SIGINT so Render can
 * drain in-flight requests before killing the process.
 */

'use strict';

// Load env vars before anything else so config/env.js can read them
require('dotenv').config();

const app = require('./src/app');
const config = require('./src/config/env');
const prisma = require('./src/config/prisma');

const PORT = config.port;

// ── Start Server ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   Brightloop Software — Backend Server           ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Environment : ${config.nodeEnv}`);
  console.log(`  Port        : ${PORT}`);
  console.log(`  Health URL  : http://localhost:${PORT}/api/health`);
  console.log('');
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully…`);

  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    await prisma.$disconnect();
    console.log('[Server] Database connection closed.');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('[Server] Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Catch unhandled promise rejections (e.g. DB query errors that were not caught)
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  // Do NOT exit — log and continue so a single bad request doesn't crash the server
});

