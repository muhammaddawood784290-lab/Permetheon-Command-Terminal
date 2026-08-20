// =====================================================================
// src/services/userService.js
// Phase 4 — Users Module business logic.
//
// All DB access goes through this service — controllers never run SQL
// directly. SQL is parameterized via the `query()` helper. Public
// response shapes come from `publicUser(row)` which NEVER includes
// `password_hash` or any credential material.
//
// RULES (enforced server-side, mirrored in the frontend):
//   • Email must be unique across the workspace (case-insensitive).
//   • An admin cannot change their own role (403).
//   • An admin cannot deactivate their own account (403).
//   • The last active ADMIN cannot be demoted (409).
//   • The last active ADMIN cannot be deactivated (409).
//   • Role changes and status changes go through dedicated endpoints,
//     not the generic `PATCH /:id` body — so the audit trail stays
//     consistent.
//   • No row may have its `password_hash` field exposed in any API
//     response.
//
// ACTIVITY HOOKS (integration point only — Phase 4+ wires persistence):
//   Every mutating function emits exactly one structured event via
//   activityService.logEvent:
//     USER_CREATED       — emit on create()
//     USER_UPDATED       — emit on update()  (includes before/after diff)
//     USER_ROLE_CHANGED  — emit on changeRole() (includes from/to)
//     USER_DEACTIVATED   — emit on changeStatus() when leaving ACTIVE
//     USER_REACTIVATED   — emit on changeStatus() when returning to ACTIVE
// =====================================================================

const crypto = require('crypto');
const { query } = require('../config/database');
const { hashPassword } = require('../utils/password');
const ApiError = require('../utils/apiError');
const activityService = require('./activityService');
const { ROLE, STATUS } = require('../utils/permissions');

// ----- regex / limits ----------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const MAX_Q_LENGTH = 100;
const MAX_NAME_LENGTH = 150;     // matches users.name VARCHAR(150)
const MAX_TITLE_LENGTH = 80;     // matches the frontend rule
const TEMP_PASSWORD_BYTES = 9;   // -> 12 base64url chars

// ----- helpers -----------------------------------------------------
function publicUser(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    // The Phase 2 schema does not include `title` or `avatarColor`.
    // Return empty / null so the frontend can render without crashing.
    // A future migration may add these columns.
    title: '',
    avatarColor: null,
    createdAt: toIso(row.created_at),
    lastLoginAt: toIso(row.last_login_at),
    // No `tasks` table yet — Tasks module will compute these.
    taskCount: 0,
    openTasks: 0,
  };
}

function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  // mysql2 with dateStrings:false returns Date; keep this branch
  // as defense against drivers that return strings.
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

function generateTempPassword() {
  // 12 base64url chars from 9 random bytes — fits bcrypt's 72-byte
  // input limit and avoids ambiguous symbols (+ / =).
  return crypto.randomBytes(TEMP_PASSWORD_BYTES).toString('base64url');
}

const SELECT_COLUMNS =
  'id, name, email, role, status, last_login_at, created_at, updated_at';

// ----- lookups (no side effects) ----------------------------------
async function findUserById(id) {
  if (id === undefined || id === null) return null;
  const rows = await query(
    `SELECT ${SELECT_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows.length > 0 ? rows[0] : null;
}

async function findUserByEmail(email) {
  if (!email) return null;
  const rows = await query(
    `SELECT ${SELECT_COLUMNS} FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
    [String(email).trim()],
  );
  return rows.length > 0 ? rows[0] : null;
}

async function emailExists(email, excludeId = null) {
  if (!email) return false;
  let sql, params;
  if (excludeId !== undefined && excludeId !== null) {
    sql = `SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id <> ? LIMIT 1`;
    params = [String(email).trim(), excludeId];
  } else {
    sql = `SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`;
    params = [String(email).trim()];
  }
  const rows = await query(sql, params);
  return rows.length > 0;
}

async function countActiveAdmins() {
  const rows = await query(
    `SELECT COUNT(*) AS n FROM users WHERE role = ? AND status = ?`,
    [ROLE.ADMIN, STATUS.ACTIVE],
  );
  return Number(rows[0]?.n || 0);
}

// ----- list --------------------------------------------------------
/**
 * List users with search / filter / sort / pagination.
 * Returns { items, page, limit, total, totalPages } so the controller
 * can hand it straight to the `paginated()` response helper.
 *
 * Sanitizes inputs:
 *   • page >= 1 (default 1)
 *   • 1 <= limit <= MAX_LIMIT (default DEFAULT_LIMIT)
 *   • sort whitelisted to a fixed allowlist
 *   • order normalized to 'asc' | 'desc'
 *   • role / status validated against canonical constants
 *   • q truncated to MAX_Q_LENGTH
 */
async function list({
  page = 1,
  limit = DEFAULT_LIMIT,
  q,
  role,
  status,
  sort = 'name',
  order = 'asc',
} = {}) {
  // ---- sanitize page / limit ----
  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const safeLimit = Math.min(
    MAX_LIMIT,
    Math.max(1, Math.floor(Number(limit)) || DEFAULT_LIMIT),
  );

  // ---- sanitize role / status ----
  const safeRole = role && role !== 'all' && ROLE[role] ? role : null;
  const safeStatus = status && status !== 'all' && STATUS[status] ? status : null;

  // ---- sanitize q ----
  const safeQ =
    q && typeof q === 'string'
      ? String(q).trim().slice(0, MAX_Q_LENGTH)
      : '';

  // ---- sanitize sort ----
  const SORT_WHITELIST = {
    name: 'name',
    role: 'role',
    status: 'status',
    createdAt: 'created_at',
    lastLoginAt: 'last_login_at',
  };
  const sortColumn = SORT_WHITELIST[sort] || 'name';
  const safeOrder = order === 'desc' ? 'DESC' : 'ASC';

  // ---- build WHERE ----
  const where = [];
  const params = [];
  if (safeRole) {
    where.push('role = ?');
    params.push(safeRole);
  }
  if (safeStatus) {
    where.push('status = ?');
    params.push(safeStatus);
  }
  if (safeQ) {
    where.push('(LOWER(name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))');
    const like = '%' + safeQ.replace(/[%_]/g, '\\$&') + '%';
    params.push(like, like);
  }
  const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  // ---- count ----
  const countRows = await query(
    `SELECT COUNT(*) AS n FROM users ${whereSql}`,
    params,
  );
  const total = Number(countRows[0]?.n || 0);

  // ---- page ----
  const offset = (safePage - 1) * safeLimit;
  const rows = await query(
    `SELECT ${SELECT_COLUMNS} FROM users ${whereSql} ` +
      `ORDER BY ${sortColumn} ${safeOrder}, id ASC ` +
      `LIMIT ? OFFSET ?`,
    [...params, safeLimit, offset],
  );

  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  return {
    items: rows.map(publicUser),
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
  };
}

// ----- stats -------------------------------------------------------
async function stats() {
  const rows = await query(
    `SELECT role, status, COUNT(*) AS n FROM users GROUP BY role, status`,
  );
  const total = rows.reduce((acc, r) => acc + Number(r.n), 0);
  const byStatus = {
    [STATUS.ACTIVE]: 0,
    [STATUS.INACTIVE]: 0,
    [STATUS.SUSPENDED]: 0,
  };
  const byRole = { [ROLE.ADMIN]: 0, [ROLE.TEAM_LEAD]: 0, [ROLE.DEVELOPER]: 0 };
  let activeAdmins = 0;
  for (const r of rows) {
    const n = Number(r.n);
    if (byStatus[r.status] !== undefined) byStatus[r.status] += n;
    if (byRole[r.role] !== undefined) byRole[r.role] += n;
    if (r.role === ROLE.ADMIN && r.status === STATUS.ACTIVE) activeAdmins += n;
  }
  return {
    total,
    active: byStatus[STATUS.ACTIVE],
    inactive: byStatus[STATUS.INACTIVE],
    suspended: byStatus[STATUS.SUSPENDED],
    byRole,
    activeAdmins,
  };
}

// ----- create ------------------------------------------------------
/**
 * Create a new workspace user.
 *   • Generates a random 12-char temporary password; the hash is stored,
 *     the plaintext is NEVER returned in the response and NEVER logged.
 *   • Validates name, email, role. Status defaults to ACTIVE.
 *   • Enforces email uniqueness (case-insensitive).
 *   • Emits a USER_CREATED activity event.
 *
 * Throws ApiError(400/409) on validation / conflict.
 */
async function create({ name, email, role, status = STATUS.ACTIVE }, actor) {
  // ---- validate ----
  const trimmedName = name === undefined || name === null ? '' : String(name).trim();
  if (!trimmedName || trimmedName.length < 2) {
    throw ApiError.badRequest('Name must be at least 2 characters.', 'VALIDATION_NAME');
  }
  if (trimmedName.length > MAX_NAME_LENGTH) {
    throw ApiError.badRequest(
      `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
      'VALIDATION_NAME',
    );
  }
  const trimmedEmail = email === undefined || email === null ? '' : String(email).trim();
  if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
    throw ApiError.badRequest('A valid email address is required.', 'VALIDATION_EMAIL');
  }
  if (!ROLE[role]) {
    throw ApiError.badRequest('Pick a valid role.', 'VALIDATION_ROLE');
  }
  if (!STATUS[status]) {
    throw ApiError.badRequest('Pick a valid status.', 'VALIDATION_STATUS');
  }

  // ---- uniqueness ----
  if (await emailExists(trimmedEmail)) {
    throw ApiError.conflict('A user with this email already exists.', 'EMAIL_TAKEN');
  }

  // ---- persist ----
  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);
  const result = await query(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
    [trimmedName, trimmedEmail, hash, role, status],
  );
  const newId = Number(result.insertId);

  // ---- fetch fresh row (so created_at etc are populated) ----
  const row = await findUserById(newId);

  // ---- activity hook ----
  activityService
    .logEvent({
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      action: 'USER_CREATED',
      targetType: 'user',
      targetId: newId,
      targetLabel: trimmedName,
      metadata: { role, status },
    })
    .catch(() => {}); // never let logging crash a successful create

  return publicUser(row);
}

// ----- update ------------------------------------------------------
/**
 * Update a user's profile fields. Does NOT touch `role` (use
 * changeRole) and does NOT touch `password_hash` (no password reset
 * endpoint exists in Phase 4).
 *
 * Editable fields: name, email, title (reserved — no schema column),
 * status. The frontend already filters role out of the PATCH body.
 * For defense in depth, this service ignores `role` and `password`
 * fields even if they appear in the payload.
 */
async function update(id, payload, actor) {
  const existing = await findUserById(id);
  if (!existing) {
    throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
  }

  // Build a parameterized SET clause from a fixed allowlist.
  const sets = [];
  const params = [];
  const before = {
    name: existing.name,
    email: existing.email,
    status: existing.status,
  };
  const after = { ...before };

  if (payload && Object.prototype.hasOwnProperty.call(payload, 'name')) {
    const trimmedName = String(payload.name || '').trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw ApiError.badRequest('Name must be at least 2 characters.', 'VALIDATION_NAME');
    }
    if (trimmedName.length > MAX_NAME_LENGTH) {
      throw ApiError.badRequest(
        `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
        'VALIDATION_NAME',
      );
    }
    sets.push('name = ?');
    params.push(trimmedName);
    after.name = trimmedName;
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, 'email')) {
    const trimmedEmail = String(payload.email || '').trim();
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      throw ApiError.badRequest('A valid email address is required.', 'VALIDATION_EMAIL');
    }
    if (await emailExists(trimmedEmail, id)) {
      throw ApiError.conflict('A user with this email already exists.', 'EMAIL_TAKEN');
    }
    sets.push('email = ?');
    params.push(trimmedEmail);
    after.email = trimmedEmail;
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, 'status')) {
    if (!STATUS[payload.status]) {
      throw ApiError.badRequest('Pick a valid status.', 'VALIDATION_STATUS');
    }
    // Self-deactivation guard.
    if (
      Number(actor?.id) === Number(id) &&
      payload.status !== STATUS.ACTIVE &&
      existing.status === STATUS.ACTIVE
    ) {
      throw ApiError.forbidden(
        'You cannot deactivate your own account.',
        'SELF_DEACTIVATION',
      );
    }
    // Last-active-admin guard.
    if (
      existing.role === ROLE.ADMIN &&
      existing.status === STATUS.ACTIVE &&
      payload.status !== STATUS.ACTIVE &&
      (await countActiveAdmins()) <= 1
    ) {
      throw ApiError.conflict(
        'Cannot deactivate the last administrator.',
        'LAST_ADMIN',
      );
    }
    sets.push('status = ?');
    params.push(payload.status);
    after.status = payload.status;
  }

  // title is not a schema column in Phase 2; accept but don't persist.
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'title')) {
    const trimmedTitle = String(payload.title || '').trim();
    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      throw ApiError.badRequest(
        `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
        'VALIDATION_TITLE',
      );
    }
    // Reserved for a future migration; no SET column today.
  }

  // If nothing to change, return the existing row.
  if (sets.length === 0) {
    return publicUser(existing);
  }

  params.push(id);
  await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);

  const row = await findUserById(id);

  activityService
    .logEvent({
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      action: 'USER_UPDATED',
      targetType: 'user',
      targetId: Number(id),
      targetLabel: row?.name || existing.name,
      metadata: { before, after },
    })
    .catch(() => {});

  return publicUser(row);
}

// ----- changeRole --------------------------------------------------
/**
 * Change a user's role.
 *   • Self-protection: an admin cannot change their own role.
 *   • Last-admin guard: the last active ADMIN cannot be demoted.
 *   • Emits USER_ROLE_CHANGED with { from, to }.
 */
async function changeRole(id, role, actor) {
  if (!ROLE[role]) {
    throw ApiError.badRequest('Pick a valid role.', 'VALIDATION_ROLE');
  }
  const existing = await findUserById(id);
  if (!existing) {
    throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
  }

  // Self-protection.
  if (Number(actor?.id) === Number(id)) {
    throw ApiError.forbidden('You cannot change your own role.', 'SELF_DEMOTION');
  }
  // Last-admin guard.
  if (
    existing.role === ROLE.ADMIN &&
    role !== ROLE.ADMIN &&
    (await countActiveAdmins()) <= 1
  ) {
    throw ApiError.conflict('Cannot demote the last administrator.', 'LAST_ADMIN');
  }
  // No-op.
  if (existing.role === role) {
    return publicUser(existing);
  }

  const from = existing.role;
  await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  const row = await findUserById(id);

  activityService
    .logEvent({
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      action: 'USER_ROLE_CHANGED',
      targetType: 'user',
      targetId: Number(id),
      targetLabel: row?.name || existing.name,
      metadata: { from, to: role },
    })
    .catch(() => {});

  return publicUser(row);
}

// ----- changeStatus ------------------------------------------------
/**
 * Change a user's status (ACTIVE / INACTIVE / SUSPENDED).
 *   • Self-protection: cannot leave ACTIVE on your own account.
 *   • Last-admin guard: the last active ADMIN cannot leave ACTIVE.
 *   • Emits USER_DEACTIVATED when leaving ACTIVE, USER_REACTIVATED when
 *     returning to ACTIVE.
 */
async function changeStatus(id, status, actor) {
  if (!STATUS[status]) {
    throw ApiError.badRequest('Pick a valid status.', 'VALIDATION_STATUS');
  }
  const existing = await findUserById(id);
  if (!existing) {
    throw ApiError.notFound('User not found.', 'USER_NOT_FOUND');
  }

  // Self-protection: actor cannot take themselves out of ACTIVE.
  if (
    Number(actor?.id) === Number(id) &&
    status !== STATUS.ACTIVE &&
    existing.status === STATUS.ACTIVE
  ) {
    throw ApiError.forbidden('You cannot deactivate your own account.', 'SELF_DEACTIVATION');
  }
  // Last-admin guard.
  if (
    existing.role === ROLE.ADMIN &&
    existing.status === STATUS.ACTIVE &&
    status !== STATUS.ACTIVE &&
    (await countActiveAdmins()) <= 1
  ) {
    throw ApiError.conflict('Cannot deactivate the last administrator.', 'LAST_ADMIN');
  }
  // No-op.
  if (existing.status === status) {
    return publicUser(existing);
  }

  const from = existing.status;
  await query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  const row = await findUserById(id);

  const action =
    status === STATUS.ACTIVE ? 'USER_REACTIVATED' : 'USER_DEACTIVATED';

  activityService
    .logEvent({
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      action,
      targetType: 'user',
      targetId: Number(id),
      targetLabel: row?.name || existing.name,
      metadata: { from, to: status },
    })
    .catch(() => {});

  return publicUser(row);
}

// ----- exports -----------------------------------------------------
module.exports = {
  STATUS,
  ROLE,
  publicUser,
  findUserById,
  findUserByEmail,
  emailExists,
  countActiveAdmins,
  list,
  stats,
  create,
  update,
  changeRole,
  changeStatus,
};
