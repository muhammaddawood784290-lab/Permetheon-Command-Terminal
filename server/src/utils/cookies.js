// =====================================================================
// src/utils/cookies.js
// Single place that knows the auth cookie name, lifetime, and flags.
//
// We follow the AUTH spec (HttpOnly, Secure-when-prod, SameSite=Lax)
// and SECURITY.md §5 (never set Secure in development over plain HTTP
// because browsers will drop the cookie).
// =====================================================================

const env = require('../config/env');

const COOKIE_NAME = env.SESSION_COOKIE_NAME || 'pct_sid';
const MAX_AGE_MS = parseInt(env.SESSION_COOKIE_MAX_AGE_MS, 10) || 8 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.IS_PRODUCTION,            // false over plain HTTP in dev
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_MS,
  };
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
  });
}

function readSessionCookie(req) {
  // cookie-parser is mounted in app.js; falls back to manual parse
  // for tests that don't use it.
  if (req.cookies && Object.prototype.hasOwnProperty.call(req.cookies, COOKIE_NAME)) {
    return req.cookies[COOKIE_NAME];
  }
  const raw = req.headers && req.headers.cookie;
  if (!raw) return undefined;
  const parts = raw.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === COOKIE_NAME) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

module.exports = {
  COOKIE_NAME,
  MAX_AGE_MS,
  setSessionCookie,
  clearSessionCookie,
  readSessionCookie,
};
