// =====================================================================
// activityService — fetches the system activity log.
//
// Phase 1: serves mock data. Phase 2 swap: replace these methods with
// real HTTP calls (or pass `useMock: false` to a single helper) — the
// service shape stays the same so callers do not need to change.
//
// Filters supported:
//   - search       : free-text across summary + actor + target
//   - actor        : actorId
//   - actions      : array of activity actions
//   - targetTypes  : array of target types (task, project, user, ...)
//   - project      : projectId (narrows task/project/file/comment entries)
//   - dateFrom     : ISO string (inclusive)
//   - dateTo       : ISO string (inclusive)
//   - sort         : createdAt (default) | action | actorName | targetLabel
//   - order        : desc (default) | asc
//   - page, limit  : pagination
//
// Result shape: { items, page, limit, total, totalPages }
// =====================================================================

import { ok, paginate, search, sortBy } from './api';
import { mockActivity } from '../mock/mockData';
import { ACTIVITY_ACTION_CATEGORY_MAP } from '../utils/constants';

const SORTABLE = new Set(['createdAt', 'action', 'actorName', 'targetLabel']);

function applyActivityFilters(list, params) {
  const {
    actor,
    actions,
    targetTypes,
    project,
    dateFrom,
    dateTo,
  } = params;

  return list.filter((item) => {
    if (actor && item.actorId !== actor) return false;
    if (Array.isArray(actions) && actions.length > 0 && !actions.includes(item.action)) return false;
    if (Array.isArray(targetTypes) && targetTypes.length > 0 && !targetTypes.includes(item.targetType)) return false;
    if (project && item.projectId !== project) return false;
    if (dateFrom && new Date(item.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(item.createdAt) > new Date(dateTo)) return false;
    return true;
  });
}

export const activityService = {
  /**
   * List activity entries with filters + pagination.
   * Default sort is `createdAt` desc — newest first — per ACTIVITY_LOG.md.
   */
  async list(params = {}) {
    let list = [...mockActivity];

    list = applyActivityFilters(list, params);

    if (params.search) {
      list = search(list, ['summary', 'actorName', 'targetLabel', 'action'], params.search);
    }

    const sortField = SORTABLE.has(params.sort) ? params.sort : 'createdAt';
    list = sortBy(list, sortField, params.order || 'desc');

    return ok(paginate(list, { page: params.page || 1, limit: params.limit || 50 }));
  },

  /**
   * Get a single activity entry by id.
   */
  async getById(id) {
    const entry = mockActivity.find((a) => a.id === id);
    if (!entry) {
      return ok(null);
    }
    return ok(entry);
  },

  /**
   * Aggregated stats for the dashboard above the timeline.
   * Uses the same filter pipeline as list() so the counts stay consistent
   * with what the user is actually seeing.
   */
  async getStats(params = {}) {
    const filtered = applyActivityFilters([...mockActivity], params);

    const byCategory = {};
    const byAction = {};
    const byActor = {};
    const byTargetType = {};
    const byDay = {};

    filtered.forEach((entry) => {
      const category = ACTIVITY_ACTION_CATEGORY_MAP[entry.action] || 'OTHER';
      byCategory[category] = (byCategory[category] || 0) + 1;
      byAction[entry.action] = (byAction[entry.action] || 0) + 1;
      byActor[entry.actorId] = byActor[entry.actorId] || {
        actorId: entry.actorId,
        actorName: entry.actorName,
        actorRole: entry.actorRole,
        count: 0,
      };
      byActor[entry.actorId].count += 1;
      byTargetType[entry.targetType] = (byTargetType[entry.targetType] || 0) + 1;

      const dayKey = entry.createdAt ? entry.createdAt.slice(0, 10) : 'unknown';
      byDay[dayKey] = (byDay[dayKey] || 0) + 1;
    });

    // Last 7 days, in chronological order, filling zeros for empty days.
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      last7Days.push({ date: key, count: byDay[key] || 0 });
    }

    const topActors = Object.values(byActor)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totals = {
      total: filtered.length,
      today: byDay[today.toISOString().slice(0, 10)] || 0,
      uniqueActors: Object.keys(byActor).length,
      uniqueActions: Object.keys(byAction).length,
    };

    return ok({
      totals,
      byCategory,
      byAction,
      byTargetType,
      topActors,
      last7Days,
    });
  },

  /**
   * Distinct values the UI uses to populate filter dropdowns.
   * Pulled from the full mock dataset so the options stay stable as the
   * user narrows the timeline.
   */
  async getFilterOptions() {
    const actors = new Map();
    const actions = new Set();
    const targetTypes = new Set();
    const projects = new Set();

    mockActivity.forEach((entry) => {
      if (entry.actorId) {
        actors.set(entry.actorId, {
          id: entry.actorId,
          name: entry.actorName,
          role: entry.actorRole,
        });
      }
      if (entry.action) actions.add(entry.action);
      if (entry.targetType) targetTypes.add(entry.targetType);
      if (entry.projectId) projects.add(entry.projectId);
    });

    return ok({
      actors: Array.from(actors.values()),
      actions: Array.from(actions),
      targetTypes: Array.from(targetTypes),
      projects: Array.from(projects),
    });
  },
};

export default activityService;