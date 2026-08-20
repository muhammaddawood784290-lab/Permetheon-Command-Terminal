// =====================================================================
// src/routes/authzRoutes.js
// Phase 3 — Authorization smoke surface.
//
// These endpoints are deliberately tiny. They exist to prove the
// authorization layer works BEFORE Phase 4+ wires in the real business
// logic for each module. Each route:
//
//   1. requires requireAuth (401 if unauthenticated)
//   2. requires one canonical V1 permission (403 if the role lacks it)
//   3. returns {success:true, allowed:true} on success
//
// No state is mutated. No business logic is implemented. Phase 4+ will
// replace each of these handlers with a real controller.
//
// Path layout: /api/authz/<module>/<permission>
//   e.g. GET /api/authz/projects/view -> requirePermission('project.view')
//
// Resource-level scope is out of scope for Phase 3 — that arrives in
// the modules where Projects / Tasks / Reviews are implemented.
// =====================================================================

const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');
const { success } = require('../utils/response');

const router = express.Router();

// Each entry: { method, path, permission }.
// Keeping it declarative makes the route list easy to sweep with
// the matrix test.
const ROUTES = [
  // Projects
  { method: 'get',    path: '/projects/view',                permission: 'project.view' },
  { method: 'post',   path: '/projects/create',              permission: 'project.create' },
  { method: 'patch',  path: '/projects/update',              permission: 'project.update' },
  { method: 'delete', path: '/projects/delete',              permission: 'project.delete' },
  { method: 'patch',  path: '/projects/archive',             permission: 'project.archive' },
  { method: 'patch',  path: '/projects/manage-members',      permission: 'project.manageMembers' },

  // Tasks
  { method: 'get',    path: '/tasks/view',                   permission: 'task.view' },
  { method: 'post',   path: '/tasks/create',                 permission: 'task.create' },
  { method: 'patch',  path: '/tasks/update',                 permission: 'task.update' },
  { method: 'delete', path: '/tasks/delete',                 permission: 'task.delete' },
  { method: 'patch',  path: '/tasks/assign',                 permission: 'task.assign' },
  { method: 'patch',  path: '/tasks/change-status',          permission: 'task.changeStatus' },

  // Reviews
  { method: 'get',    path: '/reviews/view',                 permission: 'review.view' },
  { method: 'post',   path: '/reviews/submit',               permission: 'review.submit' },
  { method: 'patch',  path: '/reviews/start',                permission: 'review.start' },
  { method: 'patch',  path: '/reviews/approve',              permission: 'review.approve' },
  { method: 'patch',  path: '/reviews/request-revision',     permission: 'review.requestRevision' },
  { method: 'patch',  path: '/reviews/assign',               permission: 'review.assign' },

  // Files
  { method: 'post',   path: '/files/upload',                 permission: 'file.upload' },
  { method: 'get',    path: '/files/download',               permission: 'file.download' },
  { method: 'delete', path: '/files/delete',                 permission: 'file.delete' },

  // Reports
  { method: 'get',    path: '/reports/view',                 permission: 'report.view' },
  { method: 'get',    path: '/reports/export',               permission: 'report.export' },

  // Activity
  { method: 'get',    path: '/activity/view',                permission: 'activity.view' },

  // Notifications
  { method: 'get',    path: '/notifications/view',           permission: 'notification.view' },
  { method: 'patch',  path: '/notifications/mark-read',      permission: 'notification.markRead' },
  { method: 'patch',  path: '/notifications/manage',         permission: 'notification.manage' },

  // Users
  { method: 'get',    path: '/users/view',                   permission: 'user.view' },
  { method: 'post',   path: '/users/create',                 permission: 'user.create' },
  { method: 'patch',  path: '/users/update',                 permission: 'user.update' },
  { method: 'patch',  path: '/users/disable',                permission: 'user.disable' },
  { method: 'patch',  path: '/users/change-role',            permission: 'user.changeRole' },

  // Settings
  { method: 'get',    path: '/settings/view',                permission: 'settings.view' },
  { method: 'patch',  path: '/settings/update',              permission: 'settings.update' },
];

for (const r of ROUTES) {
  router[r.method](
    r.path,
    requireAuth,
    requirePermission(r.permission),
    (req, res) =>
      success(
        res,
        { allowed: true, permission: r.permission, userId: req.user.id, role: req.user.role },
        `permission ${r.permission} granted`,
      ),
  );
}

module.exports = router;
module.exports.ROUTES = ROUTES;
