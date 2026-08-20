// =====================================================================
// commentService — fetches and manipulates task comments.
// Comments emit COMMENT_CREATED events on add so the Activity page can
// surface a developer conversation that happened on a task.
// =====================================================================

import { ok, fail, sortBy } from './api';
import { mockComments, findTaskById } from '../mock/mockData';
import { ACTIVITY_ACTION } from '../utils/constants';
import { recordActivity } from './activityHelpers';

export const commentService = {
  async listForTask(taskId) {
    return ok(sortBy(mockComments.filter((c) => c.taskId === taskId), 'createdAt', 'asc'));
  },

  async add(taskId, payload, { actor } = {}) {
    const { authorId, authorName, authorRole, message } = payload;
    if (!message || !message.trim()) return fail('Comment cannot be empty.', 400);

    const author = actor || {};
    const resolvedId = author.id || authorId || 'u_1';
    const resolvedName = author.name || authorName || 'You';
    const resolvedRole = author.role || authorRole || 'DEVELOPER';

    const comment = {
      id: 'c_' + (mockComments.length + 1),
      taskId,
      authorId: resolvedId,
      authorName: resolvedName,
      authorRole: resolvedRole,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    mockComments.push(comment);

    const task = findTaskById(taskId);
    if (actor && task) {
      recordActivity({
        action: ACTIVITY_ACTION.COMMENT_CREATED,
        actor,
        targetType: 'task',
        targetId: task.id,
        targetLabel: task.title,
        projectId: task.projectId,
        summary: `${resolvedName} commented on ${task.title}`,
        metadata: {
          commentId: comment.id,
          preview: message.trim().slice(0, 140),
        },
      });
    }

    return ok(comment);
  },

  async remove(id, { actor } = {}) {
    const idx = mockComments.findIndex((c) => c.id === id);
    if (idx === -1) return fail('Comment not found.', 404);
    const removed = mockComments[idx];
    mockComments.splice(idx, 1);

    if (actor) {
      const task = findTaskById(removed.taskId);
      recordActivity({
        action: ACTIVITY_ACTION.COMMENT_DELETED,
        actor,
        targetType: 'task',
        targetId: removed.taskId,
        targetLabel: task?.title || removed.taskId,
        projectId: task?.projectId,
        summary: `${actor.name} deleted a comment on ${task?.title || removed.taskId}`,
        metadata: { commentId: removed.id },
      });
    }

    return ok({ id });
  },
};

export default commentService;