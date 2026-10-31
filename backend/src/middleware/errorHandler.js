/**
 * src/middleware/errorHandler.js
 *
 * Global Express error-handling middleware.
 * Must have exactly 4 parameters (err, req, res, next) for Express to
 * recognise it as an error handler.
 *
 * Catches all errors thrown or passed via next(err) in any route/controller.
 */

'use strict';

const config = require('../config/env');

/**
 * Normalise an error into a consistent JSON response.
 *
 * Production responses never expose internal stack traces.
 * Development responses include the stack to aid debugging.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Prisma unique-constraint violation → map to 409 Conflict
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    return res.status(409).json({
      success: false,
      error: `A record with that ${field} already exists.`,
    });
  }

  // Prisma record-not-found → 404
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found.',
    });
  }

  // Zod validation errors (thrown manually as { statusCode, issues })
  if (err.isZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed.',
      details: err.issues,
    });
  }

  // Any other explicit statusCode set on the error object
  const statusCode = err.statusCode || err.status || 500;
  const message =
    statusCode < 500
      ? err.message
      : config.isProd
      ? 'An unexpected server error occurred.'
      : err.message;

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`);
  if (config.isDev) console.error(err.stack);

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;

