// =====================================================================
// src/services/activityService.js
// Phase 4 — Activity integration point.
//
// The full Activity module (and its underlying `activity_logs` table)
// will be implemented in a later phase. For now every mutating service
// calls `activityService.logEvent(...)` so the seam is in place. This
// function:
//   1. Emits a structured info-level log line so the events are
//      observable in `server` output and any log aggregator.
//   2. Returns null (no persistence yet).
//
// NEVER log: password, password_hash, session token, raw cookie,
// authorization header, or any other credential material. The fields
// below are whitelisted by convention; do not pass through arbitrary
// `req.body` here.
//
// Future phase replaces the body with an INSERT into activity_logs
// without touching call sites.
// =====================================================================

const logger = require('../utils/logger');

/**
 * Log a domain activity event.
 *
 * @param {Object}  params
 * @param {number|string} params.actorId      - The user who performed the action.
 * @param {string}  params.actorName          - Display name of the actor (denormalized).
 * @param {string}  params.action             - Canonical action enum (e.g. USER_CREATED).
 * @param {string}  params.targetType         - 'user' | 'project' | 'task' | ...
 * @param {number|string} params.targetId     - The id of the affected entity.
 * @param {string}  [params.targetLabel]      - Display label for the target (denormalized).
 * @param {Object}  [params.metadata]         - Structured change details (from/to, before/after).
 * @returns {Promise<null>}
 */
async function logEvent({
  actorId,
  actorName,
  action,
  targetType,
  targetId,
  targetLabel,
  metadata,
}) {
  if (!action || !targetType || targetId === undefined || targetId === null) {
    // Caller bug — silently drop rather than crash a successful mutation.
    return null;
  }

  // Whitelist the surfaced fields. Anything sensitive in `metadata`
  // is the caller's responsibility — never forward `req.body` here.
  const safeMetadata = metadata && typeof metadata === 'object' ? metadata : {};

  logger.info(
    '[activity]',
    action,
    `actor=${actorId}${actorName ? `(${actorName})` : ''}`,
    `target=${targetType}:${targetId}${targetLabel ? `(${targetLabel})` : ''}`,
    'metadata=' + JSON.stringify(safeMetadata),
  );

  return null;
}

module.exports = { logEvent };
