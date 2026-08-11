// =====================================================================
// projectService — fetches and manipulates project data.
// =====================================================================

import { ok, fail, paginate, applyFilters, search, sortBy } from './api';
import { mockProjects, findProjectById } from '../mock/mockData';

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

  async create(payload) {
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
    return ok(project);
  },

  async update(id, payload) {
    const project = findProjectById(id);
    if (!project) return fail('Project not found.', 404);
    Object.assign(project, payload, { updatedAt: new Date().toISOString() });
    return ok(project);
  },

  async remove(id) {
    const idx = mockProjects.findIndex((p) => p.id === id);
    if (idx === -1) return fail('Project not found.', 404);
    mockProjects.splice(idx, 1);
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
