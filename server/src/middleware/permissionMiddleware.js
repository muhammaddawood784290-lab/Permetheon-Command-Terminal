// =====================================================================
// src/middleware/permissionMiddleware.js
// Phase 3 — Authorization middleware.
//
// requirePermission(permission)
//   - MUST be mounted AFTER requireAuth. It reads `req.user.role`
//     populated by requireAuth from the DB-backed session.
//   - It does NOT trust any client-supplied role or permission field.
//   - If the user's role holds the permission, next() is called.
//   - If the user's role does not hold it, throws 403 FORBIDDEN.
//   - If the permission key itself is unknown (typo / not in the
//     canonical V1 set), throws 500 INTERNAL_ERROR. We fail closed:
//     a route that asks for a permission we don't recognise is a
//     server-side bug, not an open door.
//
// requireRole(...roles)
//   - Same constraints: must be after requireAuth.
//   - Use ONLY for operations that are genuinely role-specific
//     (e.g. internal admin-only bootstrapping). Prefer
//     requirePermission whenever a documented capability exists.
//
// 401 vs 403:
//   - 401 is the responsibility of requireAuth (missing/invalid session).
//   - This middleware never returns 401. It returns 403 for any
//     authenticated user who lacks the permission, OR a 500 for an
//     unknown permission name (server bug, not a client fault).
// =====================================================================

const ApiError = require('../utils/apiError');
const {
  hasPermission,
  isKnownPermission,
  ALL_PERMISSIONS,
} = require('../utils/permissions');
const logger = require('../utils/logger');

/**
 * requirePermission(permission)
 *
 * @param {string} permission  Canonical V1 permission key.
 * @returns {Function} Express middleware.
 */
function requirePermission(permission) {
  if (!permission || typeof permission !== 'string') {
    // Programmer error — bad mount. Surface immediately at boot if
    // possible, otherwise on the first request.
    throw new Error(
      'requirePermission() requires a non-empty permission string.',
    );
  }
  if (!isKnownPermission(permission)) {
    // Fail closed. Unknown perm name = server-side bug, never an
    // open door.
    throw new Error(
      `requirePermission(): unknown permission "${permission}". ` +
        `Allowed keys: ${ALL_PERMISSIONS.join(', ')}.`,
    );
  }

  return function permissionGuard(req, _res, next) {
    // requireAuth must have run first. If it didn't, req.user is
    // undefined. This is a server-side wiring mistake.
    if (!req.user || !req.user.role) {
      return next(
        new Error(
          'requirePermission() mounted before requireAuth(). ' +
            'Always chain: requireAuth -> requirePermission(...).',
        ),
      );
    }

    // Defense-in-depth: a client could try to supply their own role.
    // We deliberately ignore any client-controlled role/permission
    // fields (body.role, headers['x-role'], etc.) — only the
    // server-loaded req.user from the DB-backed session is trusted.
    if (hasPermission(req.user, permission)) {
      return next();
    }

    // Logged server-side, but never echoed to the client.
    logger.warn(
      `[${req.method} ${req.originalUrl}] forbidden`,
      `user=${req.user.id} role=${req.user.role} perm=${permission}`,
    );
    return next(
      ApiError.forbidden(
        'You do not have permission to perform this action.',
        'FORBIDDEN',
      ),
    );
  };
}

/**
 * requireRole(...roles)
 *
 * @param  {...string} roles  Role strings (ADMIN, TEAM_LEAD, DEVELOPER).
 * @returns {Function} Express middleware.
 */
function requireRole(...roles) {
  if (!roles.length) {
    throw new Error('requireRole() requires at least one role.');
  }
  const allowed = new Set(roles);

  return function roleGuard(req, _res, next) {
    if (!req.user || !req.user.role) {
      return next(
        new Error(
          'requireRole() mounted before requireAuth(). ' +
            'Always chain: requireAuth -> requireRole(...).',
        ),
      );
    }
    if (allowed.has(req.user.role)) {
      return next();
    }
    logger.warn(
      `[${req.method} ${req.originalUrl}] forbidden`,
      `user=${req.user.id} role=${req.user.role} required=${[...allowed].join('|')}`,
    );
    return next(
      ApiError.forbidden(
        'You do not have permission to perform this action.',
        'FORBIDDEN',
      ),
    );
  };
}

module.exports = {
  requirePermission,
  requireRole,
};
