// =====================================================================
// src/app.js
// Express application factory. Wires middleware and routes.
// Kept separate from server.js so tests can import the app
// without binding to a port.
// =====================================================================

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  // Trust the local reverse proxy when present (XAMPP / nginx).
  app.set('trust proxy', 1);

  // CORS — explicit allowlist, never '*' (auth-required architecture).
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow same-origin (no Origin header) and the configured frontend.
        if (!origin || origin === env.FRONTEND_URL) return cb(null, true);
        return cb(new Error(`CORS: origin ${origin} is not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }),
  );

  // Body parsers. Cap uploads at the configured file size.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Cookie parser — auth uses HttpOnly cookies, never localStorage.
  // secret is optional; we use signed cookies only if SESSION_SECRET is
  // set in production. Read helpers do not depend on signature.
  app.use(cookieParser(env.SESSION_SECRET || undefined));

  // Mount all API routes under /api.
  app.use('/api', routes);

  // Prometheus `/metrics` — public, unauthenticated.
  // Mounted at the application root (not under /api) because Prometheus
  // scrapes `/metrics` by convention, and the /api prefix is reserved
  // for the JSON envelope used by the application API.
  app.use('/metrics', require('./routes/metricsRoutes'));

  // Root — friendly pointer so curl / shows where to go.
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'PCT API',
      data: {
        service: 'pct-api',
        api: '/api',
        health: '/api/health',
        metrics: '/metrics',
      },
    });
  });

  // 404 + error handlers must be last.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
