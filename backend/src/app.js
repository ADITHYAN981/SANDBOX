/**
 * src/app.js
 *
 * Express application factory.
 * Configures middleware, API routes, and serves the static frontend.
 */

'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const apiRouter = require('./routes/index');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { seedDefaultDataIfEmpty } = require('./services/subscriptionService');

const app = express();

// ── Auto-seed demo database if empty on boot ──────────────────────────────────
seedDefaultDataIfEmpty().catch((err) => {
  console.error('[Boot] Auto-seed error:', err.message);
});

// ── Security Headers (Helmet) with Google Fonts & Inline Scripts Support ──────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", '*'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, same-origin)
      if (!origin || config.corsOrigins.includes(origin) || config.isDev) {
        return callback(null, true);
      }
      callback(null, true); // Permissive for production web deployment
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Global Rate Limiter ────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please wait a moment and try again.',
  },
});
app.use('/api', globalLimiter);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Serve Frontend Static Files ───────────────────────────────────────────────
const frontendDir = path.resolve(__dirname, '../../');
app.use(express.static(frontendDir));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Fallback to frontend index.html for non-API routes (SPA support) ─────────
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(frontendDir, 'index.html'));
  }
  next();
});

// ── 404 Handler for API ───────────────────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
