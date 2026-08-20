// =====================================================================
// src/routes/userRoutes.js
// Phase 4 — Users Module routes.
//
// Every route is mounted as:
//   requireAuth -> requirePermission(<key>) -> controller.method
//
// Permission keys come from the canonical matrix in
// server/src/utils/permissions.js (34 keys, identical to
// client/src/utils/permissions.js).
//
// Path order matters: literal paths (/stats, /email-exists) are
// declared BEFORE the parametric /:id so they match first.
// =====================================================================

const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

// GET /api/users
router.get(
  '/',
  requireAuth,
  requirePermission('user.view'),
  userController.list,
);

// GET /api/users/stats
router.get(
  '/stats',
  requireAuth,
  requirePermission('user.view'),
  userController.stats,
);

// GET /api/users/email-exists?email=&excludeId=
router.get(
  '/email-exists',
  requireAuth,
  requirePermission('user.view'),
  userController.emailExists,
);

// GET /api/users/:id
router.get(
  '/:id',
  requireAuth,
  requirePermission('user.view'),
  userController.getById,
);

// POST /api/users
router.post(
  '/',
  requireAuth,
  requirePermission('user.create'),
  userController.create,
);

// PATCH /api/users/:id
router.patch(
  '/:id',
  requireAuth,
  requirePermission('user.update'),
  userController.update,
);

// PATCH /api/users/:id/role
router.patch(
  '/:id/role',
  requireAuth,
  requirePermission('user.changeRole'),
  userController.changeRole,
);

// PATCH /api/users/:id/status
router.patch(
  '/:id/status',
  requireAuth,
  requirePermission('user.disable'),
  userController.changeStatus,
);

module.exports = router;
