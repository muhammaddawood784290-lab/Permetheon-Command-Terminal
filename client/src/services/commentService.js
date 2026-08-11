// =====================================================================
// commentService — fetches and manipulates task comments.
// =====================================================================

import { ok, fail, sortBy } from './api';
import { mockComments } from '../mock/mockData';

export const commentService = {
  async listForTask(taskId) {
    return ok(sortBy(mockComments.filter((c) => c.taskId === taskId), 'createdAt', 'asc'));
  },

  async add(taskId, payload) {
    const { authorId, authorName, authorRole, message } = payload;
    if (!message || !message.trim()) return fail('Comment cannot be empty.', 400);
    const comment = {
      id: 'c_' + (mockComments.length + 1),
      taskId,
      authorId: authorId || 'u_1',
      authorName: authorName || 'You',
      authorRole: authorRole || 'DEVELOPER',
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    mockComments.push(comment);
    return ok(comment);
  },

  async remove(id) {
    const idx = mockComments.findIndex((c) => c.id === id);
    if (idx === -1) return fail('Comment not found.', 404);
    mockComments.splice(idx, 1);
    return ok({ id });
  },
};

export default commentService;
