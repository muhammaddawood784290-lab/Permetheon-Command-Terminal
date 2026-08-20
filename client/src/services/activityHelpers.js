// =====================================================================
// activityHelpers — shared helpers used by every service that emits
// activity events. Centralises:
//
//   1. recordActivity(entry)  — append to mockActivity, newest first.
//   2. notifyActivityChange() — wake any listener so the live timeline
//      refreshes without a page reload. ActivityContext subscribes via
//      useActivitySubscription() so newly created events show up in the
//      timeline immediately.
//
// Every module service writes through these helpers. No service should
// import `mockActivity` directly anymore.
// =====================================================================

import { mockActivity, findUserById, findProjectById, findTaskById } from '../mock/mockData';

// ----- id allocator --------------------------------------------------
function nextActivityId() {
  let max = 0;
  for (const a of mockActivity) {
    const n = Number(String(a.id).replace(/[^0-9]/g, ''));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `a_${max + 1}`;
}

// ----- change-notification pub/sub -----------------------------------
// The pub/sub is intentionally lightweight: a single Set of callbacks
// the ActivityContext registers into. Any service that writes through
// recordActivity() also calls notifyActivityChange() so the timeline
// refreshes without manual intervention.
const subscribers = new Set();

export function subscribeActivityChange(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function notifyActivityChange() {
  subscribers.forEach((fn) => {
    try {
      fn();
    } catch {
      // never let a subscriber crash a service call.
    }
  });
}

// ----- actor resolver ------------------------------------------------
// Returns a fully populated actor object from the caller-supplied
// argument. Falls back to a sane placeholder so a missing actor doesn't
// produce a broken row — the placeholder is only used when the calling
// UI genuinely forgets to pass a user (a code bug, not a normal flow).
function resolveActor(actor) {
  if (actor && actor.id) {
    const fresh = findUserById(actor.id);
    return fresh || {
      id: actor.id,
      name: actor.name || 'Unknown',
      role: actor.role || 'DEVELOPER',
    };
  }
  return null;
}

function resolveTarget(type, id) {
  if (!type || !id) return null;
  let entity;
  if (type === 'task') entity = findTaskById(id);
  else if (type === 'project') entity = findProjectById(id);
  else if (type === 'user') entity = findUserById(id);
  if (!entity) return null;
  return {
    id: entity.id,
    label:
      entity.name ||
      entity.title ||
      entity.label ||
      entity.code ||
      id,
  };
}

// ----- public API ----------------------------------------------------

/**
 * Append a new activity entry.
 *
 * Required:
 *   action         string  — ACTIVITY_ACTION.* constant
 *   actor          object  — the user who performed the action
 *   targetType     string  — 'task' | 'project' | 'user' | ...
 *   targetId       string  — id of the affected entity
 *   summary        string  — human-readable description
 *
 * Optional:
 *   targetLabel    string  — display label; resolved automatically if omitted
 *   metadata       object  — arbitrary structured details
 *   projectId      string  — narrows the entry to a specific project
 */
export function recordActivity({
  action,
  actor,
  targetType,
  targetId,
  targetLabel,
  summary,
  metadata,
  projectId = null,
}) {
  if (!action || !targetType || !targetId || !summary) return null;

  const resolvedActor = resolveActor(actor);
  const resolvedTarget =
    targetLabel
      ? { id: targetId, label: targetLabel }
      : resolveTarget(targetType, targetId);

  if (!resolvedActor || !resolvedTarget) return null;

  const entry = {
    id: nextActivityId(),
    action,
    actorId: resolvedActor.id,
    actorName: resolvedActor.name,
    actorRole: resolvedActor.role,
    targetType,
    targetId,
    targetLabel: resolvedTarget.label,
    projectId,
    summary,
    metadata: metadata || null,
    createdAt: new Date().toISOString(),
  };

  // Newest first so the Activity page reflects the change immediately.
  mockActivity.unshift(entry);
  notifyActivityChange();
  return entry;
}

/**
 * Resolve a project id from any entity. Used by services that receive
 * a task or comment reference and need to attach the parent project
 * to the activity row.
 */
export function resolveProjectId(targetType, targetId) {
  if (!targetType || !targetId) return null;
  if (targetType === 'project') return targetId;
  if (targetType === 'task') {
    const task = findTaskById(targetId);
    return task?.projectId || null;
  }
  return null;
}