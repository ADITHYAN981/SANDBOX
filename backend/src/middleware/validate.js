/**
 * src/middleware/validate.js
 *
 * Thin wrapper around Zod schemas.
 * Usage in a route file:
 *
 *   const { validate, body } = require('../middleware/validate');
 *   router.post('/register', validate(registerSchema), authController.register);
 *
 * The middleware parses `req.body` against the given Zod schema.
 * On success it replaces `req.body` with the *parsed/coerced* values.
 * On failure it calls next() with a formatted error object.
 */

'use strict';

const { ZodError } = require('zod');

/**
 * @param {import('zod').ZodSchema} schema  Zod schema to validate req.body against
 * @returns {import('express').RequestHandler}
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      // Parse returns the coerced/defaulted value; replace raw body with it
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Attach a flag the global error handler checks
        const error = new Error('Validation failed');
        error.isZodError = true;
        error.issues = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        error.statusCode = 400;
        return next(error);
      }
      next(err);
    }
  };
}

module.exports = { validate };

