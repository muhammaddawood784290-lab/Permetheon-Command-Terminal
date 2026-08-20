// =====================================================================
// src/middleware/authMiddleware.js
// requireAuth — verifies the session cookie, attaches req.user, or
// returns 401 with the standard error envelope.
//
// Does NOT enforce roles — that's roleMiddleware's job. requireAuth
// only answers "who are you?". Use both together when an endpoint
// needs both authentication and authorization.
// =====================================================================

const authService = require('../services/authService');
const { readSessionCookie } = require('../utils/cookies');

async function requireAuth(req, res, next) {
  try {
    const token = readSessionCookie(req);
    const result = await authService.validateSession(token);
    if (!result) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
        error: { code: 'UNAUTHORIZED' },
      });
    }
    req.user = result.user;
    req.sessionId = result.sessionId;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireAuth };
