// =====================================================================
// taskService — fetches and manipulates task data.
// Mutations emit activity events via the shared `recordActivity` helper
// so the Activity page sees them immediately.
// =====================================================================

import { ok, fail, paginate, applyFilters, search, sortBy } from './api';
import { mockTasks, findTaskById, findUserById } from '../mock/mockData';
import { ACTIVITY_ACTION } from '../utils/constants';
import { recordActivity } from './activityHelpers';

export const taskService = {
  async list(params = {}) {
    const {
      page = 1,
      limit = 20,
      search: term,
      status,
      priority,
      projectId,
      assigneeId,
      sort = 'updatedAt',
      order = 'desc',
    } = params;

    let list = [...mockTasks];
    if (status && status !== 'all') list = applyFilters(list, { status });
    if (priority && priority !== 'all') list = applyFilters(list, { priority });
    if (projectId && projectId !== 'all') list = applyFilters(list, { projectId });
    if (assigneeId) list = applyFilters(list, { assigneeId });
    if (term) list = search(list, ['title', 'code', 'description'], term);
    list = sortBy(list, sort, order);
    return ok(paginate(list, { page, limit }));
  },

  async get(id) {
    const task = findTaskById(id);
    if (!task) return fail('Task not found.', 404);
    return ok(task);
  },

  async create(payload, { actor } = {}) {
    const id = 't_' + (1000 + mockTasks.length + 1);
    const now = new Date().toISOString();
    const task = {
      id,
      code: `#${1000 + mockTasks.length + 1}`,
      status: 'BACKLOG',
      priority: 'MEDIUM',
      tags: [],
      dependencies: [],
      commentCount: 0,
      fileCount: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      ...payload,
    };
    mockTasks.unshift(task);

    if (actor) {
      recordActivity({
        action: ACTIVITY_ACTION.TASK_CREATED,
        actor,
        targetType: 'task',
        targetId: task.id,
        targetLabel: task.title,
        projectId: task.projectId,
        summary: `${actor.name} created Task ${task.code}`,
        metadata: { status: task.status, priority: task.priority },
      });
    }

    return ok(task);
  },

  async update(id, payload, { actor } = {}) {
    const task = findTaskById(id);
    if (!task) return fail('Task not found.', 404);

    const before = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: task.deadline,
      assigneeId: task.assigneeId,
      status: task.status,
    };
    Object.assign(task, payload, { updatedAt: new Date().toISOString() });

    if (actor) {
      const changedKeys = Object.keys(payload || {}).filter(
        (k) => JSON.stringify(before[k]) !== JSON.stringify(task[k]),
      );

      // Determine the strongest action implied by the diff.
      let action = ACTIVITY_ACTION.TASK_UPDATED;
      if (changedKeys.includes('priority')) {
        action = ACTIVITY_ACTION.TASK_PRIORITY_CHANGED;
      } else if (changedKeys.includes('deadline')) {
        action = ACTIVITY_ACTION.TASK_DEADLINE_CHANGED;
      }

      if (changedKeys.length > 0) {
        const summaryByAction = {
          [ACTIVITY_ACTION.TASK_UPDATED]: `${actor.name} updated Task ${task.code}`,
          [ACTIVITY_ACTION.TASK_PRIORITY_CHANGED]: `${actor.name} changed Task ${task.code} priority to ${task.priority}`,
          [ACTIVITY_ACTION.TASK_DEADLINE_CHANGED]: `${actor.name} moved Task ${task.code} deadline`,
        };

        recordActivity({
          action,
          actor,
          targetType: 'task',
          targetId: task.id,
          targetLabel: task.title,
          projectId: task.projectId,
          summary: summaryByAction[action],
          metadata: { changedFields: changedKeys, before, after: task },
        });
      }
    }

    return ok(task);
  },

  async updateStatus(id, status, { actor } = {}) {
    const task = findTaskById(id);
    if (!task) return fail('Task not found.', 404);

    const previousStatus = task.status;
    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (status === 'COMPLETED') task.completedAt = new Date().toISOString();

    if (actor && previousStatus !== status) {
      const action =
        status === 'COMPLETED'
          ? ACTIVITY_ACTION.TASK_COMPLETED
          : ACTIVITY_ACTION.TASK_STATUS_CHANGED;

      const summaryByAction = {
        [ACTIVITY_ACTION.TASK_COMPLETED]: `${actor.name} completed Task ${task.code}`,
        [ACTIVITY_ACTION.TASK_STATUS_CHANGED]: `${actor.name} moved Task ${task.code} to ${status}`,
      };

      recordActivity({
        action,
        actor,
        targetType: 'task',
        targetId: task.id,
        targetLabel: task.title,
        projectId: task.projectId,
        summary: summaryByAction[action],
        metadata: { from: previousStatus, to: status },
      });
    }

    return ok(task);
  },

  async assign(id, assigneeId, { actor } = {}) {
    const task = findTaskById(id);
    if (!task) return fail('Task not found.', 404);

    const previousAssigneeId = task.assigneeId;
    task.assigneeId = assigneeId;
    task.updatedAt = new Date().toISOString();

    if (actor && assigneeId && previousAssigneeId !== assigneeId) {
      const assignee = findUserById(assigneeId);
      const action = previousAssigneeId
        ? ACTIVITY_ACTION.TASK_REASSIGNED
        : ACTIVITY_ACTION.TASK_ASSIGNED;

      const summaryByAction = {
        [ACTIVITY_ACTION.TASK_ASSIGNED]: `${actor.name} assigned Task ${task.code} to ${assignee?.name || assigneeId}`,
        [ACTIVITY_ACTION.TASK_REASSIGNED]: `${actor.name} reassigned Task ${task.code} to ${assignee?.name || assigneeId}`,
      };

      recordActivity({
        action,
        actor,
        targetType: 'task',
        targetId: task.id,
        targetLabel: task.title,
        projectId: task.projectId,
        summary: summaryByAction[action],
        metadata: {
          from: previousAssigneeId,
          to: assigneeId,
          assigneeName: assignee?.name || assigneeId,
        },
      });
    }

    return ok(task);
  },

  async remove(id, { actor } = {}) {
    const idx = mockTasks.findIndex((t) => t.id === id);
    if (idx === -1) return fail('Task not found.', 404);
    const removed = mockTasks[idx];
    mockTasks.splice(idx, 1);
    if (actor) {
      recordActivity({
        action: ACTIVITY_ACTION.TASK_ARCHIVED,
        actor,
        targetType: 'task',
        targetId: removed.id,
        targetLabel: removed.title,
        projectId: removed.projectId,
        summary: `${actor.name} archived Task ${removed.code || removed.id}`,
      });
    }
    return ok({ id });
  },

  async stats() {
    const tasks = mockTasks;
    return ok({
      total: tasks.length,
      backlog: tasks.filter((t) => t.status === 'BACKLOG').length,
      todo: tasks.filter((t) => t.status === 'TODO').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      inReview: tasks.filter((t) => t.status === 'IN_REVIEW').length,
      revisionRequired: tasks.filter((t) => t.status === 'REVISION_REQUIRED').length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
      blocked: tasks.filter((t) => t.status === 'BLOCKED').length,
      cancelled: tasks.filter((t) => t.status === 'CANCELLED').length,
      overdue: tasks.filter((t) => {
        if (!t.deadline) return false;
        return new Date(t.deadline).getTime() < Date.now() && t.status !== 'COMPLETED' && t.status !== 'CANCELLED';
      }).length,
    });
  },

  async projectTasks(projectId) {
    return ok(mockTasks.filter((t) => t.projectId === projectId));
  },

  async myTasks(userId) {
    return ok(mockTasks.filter((t) => t.assigneeId === userId));
  },
};

export default taskService;