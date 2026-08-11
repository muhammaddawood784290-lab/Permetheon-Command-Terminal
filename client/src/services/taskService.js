// =====================================================================
// taskService — fetches and manipulates task data.
// =====================================================================

import { ok, fail, paginate, applyFilters, search, sortBy } from './api';
import { mockTasks, findTaskById } from '../mock/mockData';

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

  async create(payload) {
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
    return ok(task);
  },

  async update(id, payload) {
    const task = findTaskById(id);
    if (!task) return fail('Task not found.', 404);
    Object.assign(task, payload, { updatedAt: new Date().toISOString() });
    return ok(task);
  },

  async updateStatus(id, status) {
    const task = findTaskById(id);
    if (!task) return fail('Task not found.', 404);
    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (status === 'COMPLETED') task.completedAt = new Date().toISOString();
    return ok(task);
  },

  async assign(id, assigneeId) {
    const task = findTaskById(id);
    if (!task) return fail('Task not found.', 404);
    task.assigneeId = assigneeId;
    task.updatedAt = new Date().toISOString();
    return ok(task);
  },

  async remove(id) {
    const idx = mockTasks.findIndex((t) => t.id === id);
    if (idx === -1) return fail('Task not found.', 404);
    mockTasks.splice(idx, 1);
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
