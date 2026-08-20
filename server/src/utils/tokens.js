// =====================================================================
// src/utils/tokens.js
// Cryptographically random session tokens + their SHA-256 hashes.
//
// The raw token is sent to the browser as an HttpOnly cookie. The DB
// stores only the SHA-256 hash of the token, so a database dump alone
// cannot impersonate sessions.
// =====================================================================

const crypto = require('crypto');

const TOKEN_BYTES = 32;          // 256-bit raw token
const HASH_BYTES = 32;           // 256-bit sha256 digest
const HASH_HEX_LEN = HASH_BYTES * 2; // 64 hex chars

function generateSessionToken() {
  // raw token sent to the client (cookie)
  return crypto.randomBytes(TOKEN_BYTES).toString('base64url');
}

function hashSessionToken(rawToken) {
  if (typeof rawToken !== 'string' || rawToken.length === 0) {
    throw new Error('hashSessionToken requires a non-empty string.');
  }
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = {
  generateSessionToken,
  hashSessionToken,
  HASH_HEX_LEN,
};
