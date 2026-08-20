// =====================================================================
// src/utils/permissions.js
// Phase 3 — Centralized permission matrix.
//
// This is the SINGLE SOURCE OF TRUTH for role -> permission mapping
// on the backend. It mirrors client/src/utils/permissions.js and
// ROLE_PERMESSIONS.md §49.
//
// Rules (per ROLE_PERMESSIONS.md):
//   - Canonical V1 permission keys use camelCase compound actions
//     (review.requestRevision, project.manageMembers, task.changeStatus).
//   - Roles: ADMIN, TEAM_LEAD, DEVELOPER. No additional roles.
//   - Do NOT invent new permission names here. Do NOT rename keys.
//   - Do NOT introduce a database-driven permission system in V1.
//
// Resource-level scope (project/task/review scope) is NOT encoded here
// — that is the responsibility of the controllers/services when they
// run. Permission middleware only answers "does this role have this
// capability?". Scope is layered on top.
// =====================================================================

// ---- Role constants -------------------------------------------------
const ROLE = Object.freeze({
  ADMIN: 'ADMIN',
  TEAM_LEAD: 'TEAM_LEAD',
  DEVELOPER: 'DEVELOPER',
});

// Canonical list of role strings — used to validate `req.user.role`.
const ALL_ROLES = Object.freeze(Object.values(ROLE));

// ---- Status constants (mirror authService.STATUS) -------------------
const STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
});

// ---- Permission matrix ---------------------------------------------
// Map each canonical permission key to the roles that hold it.
// The frontend helper carries the same structure.
const PERMISSIONS = Object.freeze({
  // Projects
  'project.view': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'project.create': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'project.update': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'project.delete': [ROLE.ADMIN],
  'project.archive': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'project.manageMembers': [ROLE.ADMIN, ROLE.TEAM_LEAD],

  // Tasks
  'task.view': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'task.create': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'task.update': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'task.delete': [ROLE.ADMIN],
  'task.assign': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'task.changeStatus': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],

  // Reviews
  'review.view': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'review.submit': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'review.start': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'review.approve': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'review.requestRevision': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'review.assign': [ROLE.ADMIN],

  // Files
  'file.upload': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'file.download': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'file.delete': [ROLE.ADMIN, ROLE.TEAM_LEAD],

  // Reports
  'report.view': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'report.export': [ROLE.ADMIN, ROLE.TEAM_LEAD],

  // Activity
  'activity.view': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],

  // Notifications — every authenticated user can view and mark their
  // own notifications; only admins can manage global settings.
  'notification.view': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'notification.markRead': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'notification.manage': [ROLE.ADMIN],

  // Users / roles
  'user.view': [ROLE.ADMIN, ROLE.TEAM_LEAD],
  'user.create': [ROLE.ADMIN],
  'user.update': [ROLE.ADMIN],
  'user.disable': [ROLE.ADMIN],
  'user.changeRole': [ROLE.ADMIN],

  // Settings
  'settings.view': [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER],
  'settings.update': [ROLE.ADMIN],
});

// Frozen list of canonical permission keys (for unknown-perm detection).
const ALL_PERMISSIONS = Object.freeze(Object.keys(PERMISSIONS));

// ---- Helpers --------------------------------------------------------

/**
 * Returns true iff `user` (or any object with a `.role` field) holds
 * the given permission key. Returns false for unknown permissions —
 * never throws. This is the same shape as the frontend hasPermission.
 */
function hasPermission(user, permission) {
  if (!user || !permission) return false;
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(user.role);
}

function hasAnyPermission(user, permissions = []) {
  return permissions.some((p) => hasPermission(user, p));
}

function hasAllPermissions(user, permissions = []) {
  return permissions.every((p) => hasPermission(user, p));
}

function getUserPermissions(user) {
  if (!user) return [];
  return ALL_PERMISSIONS.filter((p) => hasPermission(user, p));
}

/**
 * Returns true iff `permission` is one of the canonical V1 keys.
 * Used by middleware to fail closed on typos / invented names.
 */
function isKnownPermission(permission) {
  return Object.prototype.hasOwnProperty.call(PERMISSIONS, permission);
}

module.exports = {
  ROLE,
  ALL_ROLES,
  STATUS,
  PERMISSIONS,
  ALL_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  isKnownPermission,
};
