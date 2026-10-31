/**
 * src/middleware/notFound.js
 *
 * Catch-all 404 handler for any route not matched by the Express router.
 * Must be registered AFTER all valid routes.
 */

'use strict';

function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFound;

