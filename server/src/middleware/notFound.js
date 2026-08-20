// =====================================================================
// src/middleware/notFound.js
// 404 handler for any unmatched route. Sits at the end of the stack.
// =====================================================================

function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: { code: 'NOT_FOUND' },
  });
}

module.exports = notFound;
