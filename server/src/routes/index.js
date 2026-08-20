// =====================================================================
// src/routes/index.js
// Phase 3 route structure:
//   - GET /api/health              liveness + DB ping
//   - /api/auth                    real (login / logout / me)
//   - /api/authz                   Phase 3 authz smoke surface
//                                  (requireAuth + requirePermission)
//   - /api/users                   stub (still 501, but requires auth)
//   - /api/projects                stub
//   - /api/tasks                   stub
//   - /api/reviews                 stub
//   - /api/notifications           stub
//   - /api/activity                stub
//   - /api/reports                 stub
//   - /api/settings                stub
//   - /api/files                   stub
//
// Phase 3 adds the /api/authz surface so we can prove authorization
// runs *before* business logic, without depending on the still-stubbed
// modules. Stubs remain 501 so we don't accidentally expand scope.
//
// All stubs now require authentication so that 401 is returned for
// unauthenticated callers (not the legacy 501). 401-vs-403 is verified
// against /api/authz/* which carries the explicit requirePermission.
// =====================================================================

const express = require('express');
const { verifyConnection } = require('../config/database');
const { success } = require('../utils/response');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// ----- health --------------------------------------------------------
router.get('/health', async (req, res) => {
  const db = await verifyConnection();
  if (db.ok) {
    return success(
      res,
      {
        status: 'ok',
        service: 'pct-api',
        version: '0.3.0',
        uptime: process.uptime(),
        database: {
          status: 'connected',
          host: db.host,
          port: db.port,
          name: db.database,
        },
        timestamp: new Date().toISOString(),
      },
      'PCT API is running',
    );
  }

  return res.status(200).json({
    success: false,
    message: 'PCT API is running but the database is not reachable.',
    data: {
      status: 'degraded',
      service: 'pct-api',
      version: '0.3.0',
      uptime: process.uptime(),
      database: {
        status: 'disconnected',
        host: db.host,
        port: db.port,
        name: db.database,
        error: { code: db.code, message: db.message },
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// ----- real: auth ---------------------------------------------------
router.use('/auth', require('./authRoutes'));

// ----- Phase 3 authz smoke surface -----------------------------------
// Mounted BEFORE the stubs so any matching path is handled here.
router.use('/authz', require('./authzRoutes'));

// ----- stub mounts --------------------------------------------------
// Each stub now requires authentication. Permission gating on stubs is
// exercised separately via /api/authz/* (which IS gated). Stubs return
// 501 to preserve the Phase 2 contract; phase 4+ will replace them.
const STUB_PATHS = [
  '/users',
  '/projects',
  '/tasks',
  '/reviews',
  '/notifications',
  '/activity',
  '/reports',
  '/settings',
  '/files',
];

for (const mount of STUB_PATHS) {
  router.use(mount, requireAuth, (req, res) => {
    res.status(501).json({
      success: false,
      message: `Endpoint ${req.method} ${req.originalUrl} is not implemented in this phase.`,
      error: {
        code: 'NOT_IMPLEMENTED',
        details: {
          module: mount.replace('/', ''),
          phase: 3,
        },
      },
    });
  });
}

module.exports = router;
