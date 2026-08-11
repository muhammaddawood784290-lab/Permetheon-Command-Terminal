// =====================================================================
// fileService — fetches file metadata. Real implementations will
// eventually handle secure multipart uploads through Express.
// =====================================================================

import { ok, paginate, sortBy } from './api';
import { mockFiles } from '../mock/mockData';

export const fileService = {
  async listForTask(taskId) {
    return ok(mockFiles.filter((f) => f.relatedType === 'task' && f.relatedId === taskId));
  },

  async listForProject(projectId) {
    return ok(mockFiles.filter((f) => f.relatedType === 'project' && f.relatedId === projectId));
  },

  async list(params = {}) {
    const { page = 1, limit = 50 } = params;
    let list = sortBy([...mockFiles], 'createdAt', 'desc');
    return ok(paginate(list, { page, limit }));
  },

  async remove(id) {
    const idx = mockFiles.findIndex((f) => f.id === id);
    if (idx === -1) return ok({ id });
    mockFiles.splice(idx, 1);
    return ok({ id });
  },
};

export default fileService;
