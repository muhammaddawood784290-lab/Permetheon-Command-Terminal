// =====================================================================
// src/utils/password.js
// Bcrypt password hashing + comparison.
//
// We use bcryptjs (pure JS) instead of native bcrypt to avoid the
// node-gyp toolchain dependency in this environment. Cost factor 10 is
// the bcrypt default and a reasonable security/perf tradeoff.
//
// Never log hashes, plaintext passwords, or compare inputs.
// =====================================================================

const bcrypt = require('bcryptjs');

const COST = 10;

async function hashPassword(plain) {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('hashPassword requires a non-empty string.');
  }
  return bcrypt.hash(plain, COST);
}

async function comparePassword(plain, hash) {
  if (typeof plain !== 'string' || typeof hash !== 'string' || hash.length === 0) {
    return false;
  }
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    // Malformed hash, etc. — treat as no match, never throw to callers.
    return false;
  }
}

module.exports = { hashPassword, comparePassword };
