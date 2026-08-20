// =====================================================================
// src/controllers/authController.js
// Request / response shaping for /api/auth/* endpoints.
//
// Controllers are thin: they read req, call the service, format the
// response envelope, set/clear the session cookie. Business logic
// stays in authService.
// =====================================================================

const authService = require('../services/authService');
const { setSessionCookie, clearSessionCookie, readSessionCookie } = require('../utils/cookies');
const { success } = require('../utils/response');

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const result = await authService.login({ email, password });
    setSessionCookie(res, result.token);
    return success(res, { user: result.user }, 'Login successful.');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = readSessionCookie(req);
    await authService.logout(token);
    clearSessionCookie(res);
    return success(res, null, 'Logout successful.');
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    // requireAuth middleware populates req.user; if not present, treat
    // as unauthenticated.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
        error: { code: 'UNAUTHORIZED' },
      });
    }
    return success(res, { user: req.user }, 'Current user.');
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, me };
