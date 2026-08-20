// =====================================================================
// src/middleware/errorHandler.js
// Central error handler. Converts thrown ApiError / generic Error into
// the consistent JSON response shape used across the API. Never logs
// or echoes secrets, passwords, tokens, or stack traces in production.
// =====================================================================

const env = require('../config/env');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  // Known typed error from controllers/services.
  if (err instanceof ApiError) {
    if (err.status >= 500) {
      logger.error(
        `[${req.method} ${req.originalUrl}]`,
        err.code || 'API_ERROR',
        '-',
        err.message,
      );
    }
    const body = {
      success: false,
      message: err.message,
      error: { code: err.code || 'API_ERROR' },
    };
    if (err.details !== undefined && !env.IS_PRODUCTION) {
      body.error.details = err.details;
    }
    return res.status(err.status).json(body);
  }

  // Generic / unexpected error.
  const status = err.status || 500;
  const message =
    env.IS_PRODUCTION || status >= 500
      ? 'An unexpected error occurred.'
      : err.message || 'An unexpected error occurred.';

  logger.error(
    `[${req.method} ${req.originalUrl}]`,
    err.code || 'UNEXPECTED',
    '-',
    err.message || '(no message)',
  );

  return res.status(status).json({
    success: false,
    message,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      ...(env.IS_PRODUCTION ? {} : { details: err.stack }),
    },
  });
}

module.exports = errorHandler;
