// =====================================================================
// projectService — fetches and manipulates project data.
// Mutations emit activity events via the shared `recordActivity` helper
// so the Activity page sees them immediately.
// =====================================================================

import { ok, fail, paginate, applyFilters, search, sortBy } from './api';
import { mockProjects, findProjectById, findUserById } from '../mock/mockData';
import { ACTIVITY_ACTION } from '../utils/constants';
import { recordActivity } from './activityHelpers';

export const projectService = {
  async list(params = {}) {
    const { page = 1, limit = 20, search: term, status, sort = 'updatedAt', order = 'desc' } = params;
    let list = [...mockProjects];
    if (status && status !== 'all') list = applyFilters(list, { status });
    if (term) list = search(list, ['name', 'code', 'description'], term);
    list = sortBy(list, sort, order);
    return ok(paginate(list, { page, limit }));
  },

  async get(id) {
    const project = findProjectById(id);
    if (!project) return fail('Project not found.', 404);
    return ok(project);
  },

  async create(payload, { actor } = {}) {
    const id = 'p_' + (mockProjects.length + 1);
    const now = new Date().toISOString();
    const project = {
      id,
      code: payload.code || `PRM-${String(mockProjects.length + 1).padStart(3, '0')}`,
      status: 'PLANNING',
      progress: 0,
      memberIds: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
      ...payload,
    };
    mockProjects.unshift(project);

    if (actor) {
      recordActivity({
        action: ACTIVITY_ACTION.PROJECT_CREATED,
        actor,
        targetType: 'project',
        targetId: project.id,
        targetLabel: project.name,
        summary: `${actor.name} created project "${project.name}"`,
        metadata: { code: project.code, status: project.status },
      });
    }

    return ok(project);
  },

  async update(id, payload, { actor } = {}) {
    const project = findProjectById(id);
    if (!project) return fail('Project not found.', 404);

    const before = {
      name: project.name,
      description: project.description,
      status: project.status,
      tags: project.tags,
    };
    Object.assign(project, payload, { updatedAt: new Date().toISOString() });

    if (actor) {
      const changedKeys = Object.keys(payload || {}).filter(
        (k) => JSON.stringify(before[k]) !== JSON.stringify(project[k]),
      );

      if (changedKeys.length > 0) {
        const isArchive = changedKeys.includes('status') && project.status === 'ARCHIVED';
        const isRestore = changedKeys.includes('status') && project.status === 'ACTIVE';

        let action = ACTIVITY_ACTION.PROJECT_UPDATED;
        if (isArchive) action = ACTIVITY_ACTION.PROJECT_ARCHIVED;
        else if (isRestore) action = ACTIVITY_ACTION.PROJECT_RESTORED;

        const summaryByAction = {
          [ACTIVITY_ACTION.PROJECT_UPDATED]: `${actor.name} updated project "${project.name}"`,
          [ACTIVITY_ACTION.PROJECT_ARCHIVED]: `${actor.name} archived project "${project.name}"`,
          [ACTIVITY_ACTION.PROJECT_RESTORED]: `${actor.name} restored project "${project.name}"`,
        };

        recordActivity({
          action,
          actor,
          targetType: 'project',
          targetId: project.id,
          targetLabel: project.name,
          summary: summaryByAction[action],
          metadata: { changedFields: changedKeys, before, after: project },
        });
      }
    }

    return ok(project);
  },

  /**
   * Add a member to a project.
   */
  async addMember(projectId, userId, { actor } = {}) {
    const project = findProjectById(projectId);
    if (!project) return fail('Project not found.', 404);
    const user = findUserById(userId);
    if (!user) return fail('User not found.', 404);

    project.memberIds = Array.from(new Set([...(project.memberIds || []), userId]));
    project.updatedAt = new Date().toISOString();

    if (actor) {
      recordActivity({
        action: ACTIVITY_ACTION.PROJECT_MEMBER_ADDED,
        actor,
        targetType: 'project',
        targetId: project.id,
        targetLabel: project.name,
        summary: `${actor.name} added ${user.name} to ${project.name}`,
        metadata: { memberId: user.id, memberName: user.name },
      });
    }

    return ok(project);
  },

  /**
   * Remove a member from a project.
   */
  async removeMember(projectId, userId, { actor } = {}) {
    const project = findProjectById(projectId);
    if (!project) return fail('Project not found.', 404);
    const user = findUserById(userId);
    if (!user) return fail('User not found.', 404);

    project.memberIds = (project.memberIds || []).filter((id) => id !== userId);
    project.updatedAt = new Date().toISOString();

    if (actor) {
      recordActivity({
        action: ACTIVITY_ACTION.PROJECT_MEMBER_REMOVED,
        actor,
        targetType: 'project',
        targetId: project.id,
        targetLabel: project.name,
        summary: `${actor.name} removed ${user.name} from ${project.name}`,
        metadata: { memberId: user.id, memberName: user.name },
      });
    }

    return ok(project);
  },

  async remove(id, { actor } = {}) {
    const idx = mockProjects.findIndex((p) => p.id === id);
    if (idx === -1) return fail('Project not found.', 404);
    const removed = mockProjects[idx];
    mockProjects.splice(idx, 1);
    if (actor) {
      recordActivity({
        action: ACTIVITY_ACTION.PROJECT_ARCHIVED,
        actor,
        targetType: 'project',
        targetId: removed.id,
        targetLabel: removed.name,
        summary: `${actor.name} archived project "${removed.name}"`,
      });
    }
    return ok({ id });
  },

  async stats() {
    return ok({
      total: mockProjects.length,
      active: mockProjects.filter((p) => p.status === 'ACTIVE').length,
      completed: mockProjects.filter((p) => p.status === 'COMPLETED').length,
      onHold: mockProjects.filter((p) => p.status === 'ON_HOLD').length,
      planning: mockProjects.filter((p) => p.status === 'PLANNING').length,
      archived: mockProjects.filter((p) => p.status === 'ARCHIVED').length,
    });
  },
};

export default projectService;