// =====================================================================
// src/controllers/userController.js
// Phase 4 — Users Module request shaping.
//
// Controllers are thin: they parse req, call the service, and emit
// the standard response envelope. Business logic stays in userService.
// Every error thrown by the service flows through `next(err)` and is
// formatted by the central errorHandler.
// =====================================================================

const userService = require('../services/userService');
const { success, paginated } = require('../utils/response');

/**
 * GET /api/users
 * Query: ?page=&limit=&q=&role=&status=&sort=&order=
 */
async function list(req, res, next) {
  try {
    const result = await userService.list({
      page: req.query.page,
      limit: req.query.limit,
      q: req.query.q,
      role: req.query.role,
      status: req.query.status,
      sort: req.query.sort,
      order: req.query.order,
    });
    return paginated(
      res,
      result.items,
      result.page,
      result.limit,
      result.total,
      'Users.',
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/users/stats
 */
async function stats(req, res, next) {
  try {
    const data = await userService.stats();
    return success(res, data, 'User statistics.');
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/users/email-exists?email=&excludeId=
 */
async function emailExists(req, res, next) {
  try {
    const email = req.query.email;
    const excludeIdRaw = req.query.excludeId;
    const excludeId =
      excludeIdRaw === undefined || excludeIdRaw === null || excludeIdRaw === ''
        ? null
        : Number(excludeIdRaw);
    const exists = await userService.emailExists(email, excludeId);
    return success(res, exists, 'Email existence checked.');
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/users/:id
 */
async function getById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      // Route shouldn't hit this in practice (the route accepts any
      // string) but defend against it cleanly.
      return success(res, null, 'User not found.');
    }
    const row = await userService.findUserById(id);
    if (!row) {
      const ApiError = require('../utils/apiError');
      return next(ApiError.notFound('User not found.', 'USER_NOT_FOUND'));
    }
    return success(res, userService.publicUser(row), 'User.');
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/users
 * Body: { name, email, role, status? }
 */
async function create(req, res, next) {
  try {
    const body = req.body || {};
    const created = await userService.create(
      {
        name: body.name,
        email: body.email,
        role: body.role,
        status: body.status,
      },
      req.user,
    );
    return success(res, created, 'User created.', 201);
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/users/:id
 * Body: any subset of { name, email, title, status }.
 * `role` is intentionally NOT accepted on this endpoint — use
 * PATCH /api/users/:id/role so the audit trail is consistent.
 */
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      const ApiError = require('../utils/apiError');
      return next(ApiError.notFound('User not found.', 'USER_NOT_FOUND'));
    }
    // Defense in depth: strip role / password from this endpoint.
    const payload = { ...(req.body || {}) };
    delete payload.role;
    delete payload.password;
    delete payload.passwordHash;
    const updated = await userService.update(id, payload, req.user);
    return success(res, updated, 'User updated.');
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/users/:id/role
 * Body: { role }
 */
async function changeRole(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      const ApiError = require('../utils/apiError');
      return next(ApiError.notFound('User not found.', 'USER_NOT_FOUND'));
    }
    const role = req.body && req.body.role;
    const updated = await userService.changeRole(id, role, req.user);
    return success(res, updated, 'User role updated.');
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/users/:id/status
 * Body: { status }
 */
async function changeStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      const ApiError = require('../utils/apiError');
      return next(ApiError.notFound('User not found.', 'USER_NOT_FOUND'));
    }
    const status = req.body && req.body.status;
    const updated = await userService.changeStatus(id, status, req.user);
    return success(res, updated, 'User status updated.');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  list,
  stats,
  emailExists,
  getById,
  create,
  update,
  changeRole,
  changeStatus,
};
