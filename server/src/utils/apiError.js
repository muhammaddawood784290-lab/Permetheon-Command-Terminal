// =====================================================================
// src/utils/apiError.js
// Typed HTTP error with a status code.
// Throw these from controllers/services; the errorHandler converts
// them to the consistent JSON response shape used across the API.
// =====================================================================

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    if (details !== undefined) this.details = details;
  }

  static badRequest(message, code = 'BAD_REQUEST', details) {
    return new ApiError(400, code, message, details);
  }
  static unauthorized(message = 'Authentication is required.', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, message);
  }
  static forbidden(message = 'You do not have permission to perform this action.', code = 'FORBIDDEN') {
    return new ApiError(403, code, message);
  }
  static notFound(message = 'The requested resource was not found.', code = 'NOT_FOUND') {
    return new ApiError(404, code, message);
  }
  static conflict(message, code = 'CONFLICT') {
    return new ApiError(409, code, message);
  }
  static unprocessable(message, code = 'UNPROCESSABLE_ENTITY', details) {
    return new ApiError(422, code, message, details);
  }
  static internal(message = 'An unexpected error occurred.', code = 'INTERNAL_ERROR') {
    return new ApiError(500, code, message);
  }
}

module.exports = ApiError;
