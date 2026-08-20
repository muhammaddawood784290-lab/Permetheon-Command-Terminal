// =====================================================================
// src/utils/response.js
// Consistent response shape across the API.
// Matches the frontend's existing contract:
//   success: { success: true,  data, message? }
//   error:   { success: false, message, error?: { code, details? } }
// =====================================================================

function success(res, data, message, status = 200) {
  const body = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  return res.status(status).json(body);
}

function paginated(res, items, page, limit, total, message) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  return res.status(200).json({
    success: true,
    data: items,
    pagination: { page, limit, total, totalPages },
    ...(message ? { message } : {}),
  });
}

function failure(res, status, message, code, details) {
  const body = { success: false, message };
  if (code || details) {
    body.error = {};
    if (code) body.error.code = code;
    if (details !== undefined) body.error.details = details;
  }
  return res.status(status).json(body);
}

module.exports = { success, paginated, failure };
