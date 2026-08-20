// =====================================================================
// src/services/authService.js
// Authentication business logic.
//
// All DB access goes through this service — controllers never run SQL
// directly. Passwords are verified via bcrypt. Sessions are persisted
// in the `sessions` table keyed by a SHA-256 hash of the raw token;
// the raw token is sent to the browser as an HttpOnly cookie.
//
// SECURITY:
//   - Login uses a SINGLE generic error ("Invalid email or password.")
//     to prevent account enumeration. We DO NOT distinguish between
//     "no such user" and "wrong password".
//   - INACTIVE / SUSPENDED users are rejected AFTER credential check
//     passes (still generic, no enumeration).
//   - password_hash, password, raw tokens are NEVER logged.
// =====================================================================

const { query } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateSessionToken, hashSessionToken } = require('../utils/tokens');
const { MAX_AGE_MS } = require('../utils/cookies');
const ApiError = require('../utils/apiError');

// Status constants (matches the DB enum strings).
const STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
});

const GENERIC_LOGIN_ERROR = 'Invalid email or password.';

// Public shape returned to the client. NEVER include password_hash.
function publicUser(row) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
  };
}

function newExpiresAt() {
  return new Date(Date.now() + MAX_AGE_MS);
}

/**
 * Look up a user by email (case-insensitive).
 * Returns the raw row or null.
 */
async function findUserByEmail(email) {
  const rows = await query(
    'SELECT id, name, email, password_hash, role, status, last_login_at ' +
      'FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
    [email],
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Look up a user by id.
 */
async function findUserById(id) {
  const rows = await query(
    'SELECT id, name, email, password_hash, role, status, last_login_at ' +
      'FROM users WHERE id = ? LIMIT 1',
    [id],
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Create a new session row for the user, returning the raw token to
 * be sent to the browser as an HttpOnly cookie.
 */
async function createSession(userId) {
  const rawToken = generateSessionToken();
  const identifierHash = hashSessionToken(rawToken);
  const expiresAt = newExpiresAt();

  await query(
    'INSERT INTO sessions (user_id, session_identifier, expires_at) VALUES (?, ?, ?)',
    [userId, identifierHash, expiresAt],
  );

  return { rawToken, expiresAt };
}

/**
 * Resolve a session by the raw token from the cookie. Returns
 *   { user } on success
 *   null     if the token is unknown, expired, or the user is no
 *            longer ACTIVE.
 *
 * Also opportunistically prunes expired sessions for the same user
 * to keep the table small.
 */
async function validateSession(rawToken) {
  if (!rawToken) return null;
  const identifierHash = hashSessionToken(rawToken);

  const rows = await query(
    'SELECT s.id AS session_id, s.user_id, s.expires_at, ' +
      '       u.id, u.name, u.email, u.role, u.status ' +
      'FROM sessions s ' +
      'JOIN users u ON u.id = s.user_id ' +
      'WHERE s.session_identifier = ? LIMIT 1',
    [identifierHash],
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  const expires = new Date(row.expires_at).getTime();
  if (!Number.isFinite(expires) || expires < Date.now()) {
    // Expired — best-effort delete, ignore failures.
    await query('DELETE FROM sessions WHERE id = ?', [row.session_id]).catch(() => {});
    return null;
  }
  if (row.status !== STATUS.ACTIVE) {
    // Account no longer active — revoke session.
    await query('DELETE FROM sessions WHERE id = ?', [row.session_id]).catch(() => {});
    return null;
  }
  return {
    sessionId: row.session_id,
    user: publicUser(row),
  };
}

async function deleteSessionByToken(rawToken) {
  if (!rawToken) return 0;
  const identifierHash = hashSessionToken(rawToken);
  const result = await query(
    'DELETE FROM sessions WHERE session_identifier = ?',
    [identifierHash],
  );
  return result.affectedRows || 0;
}

/**
 * Login flow.
 * Returns { user, token } on success.
 * Throws ApiError(401) with a GENERIC message on any failure.
 */
async function login({ email, password }) {
  if (!email || !password) {
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR, 'INVALID_CREDENTIALS');
  }

  const user = await findUserByEmail(email);
  // Always run a bcrypt compare, even when the user does not exist,
  // to keep timing closer to a real failed login.
  const dummyHash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8pP5Z4vRkKbHJ9W2sZ.y1uN1Yp1H4i';
  const hashToCompare = user ? user.password_hash : dummyHash;
  const passwordOk = await comparePassword(password, hashToCompare);

  if (!user || !passwordOk) {
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR, 'INVALID_CREDENTIALS');
  }
  if (user.status !== STATUS.ACTIVE) {
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR, 'ACCOUNT_NOT_ACTIVE');
  }

  const { rawToken } = await createSession(user.id);

  // Best-effort last_login_at update; ignore errors.
  await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]).catch(() => {});

  return { user: publicUser(user), token: rawToken };
}

async function logout(rawToken) {
  await deleteSessionByToken(rawToken);
  return true;
}

async function getCurrentUser(rawToken) {
  const result = await validateSession(rawToken);
  return result ? result.user : null;
}

module.exports = {
  // exported for tests / seed scripts
  hashPassword,
  STATUS,
  // public API
  login,
  logout,
  getCurrentUser,
  validateSession,
  // exposed for tests
  findUserByEmail,
  findUserById,
};
