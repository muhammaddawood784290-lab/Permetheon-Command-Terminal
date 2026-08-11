// =====================================================================
// developerService — fetches developer-specific data.
// =====================================================================

import { ok } from './api';
import { mockUsers, mockTasks } from '../mock/mockData';

export const developerService = {
  async list() {
    return ok(mockUsers.filter((u) => u.role === 'DEVELOPER' || u.role === 'TEAM_LEAD'));
  },

  async get(id) {
    const user = mockUsers.find((u) => u.id === id);
    if (!user) return ok(null);
    const tasks = mockTasks.filter((t) => t.assigneeId === id);
    return ok({
      user,
      tasks,
      counts: {
        total: tasks.length,
        active: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
        inReview: tasks.filter((t) => t.status === 'IN_REVIEW').length,
        completed: tasks.filter((t) => t.status === 'COMPLETED').length,
        overdue: tasks.filter((t) => {
          if (!t.deadline) return false;
          return new Date(t.deadline).getTime() < Date.now() && t.status !== 'COMPLETED';
        }).length,
      },
    });
  },

  async workload() {
    const users = mockUsers.filter((u) => u.role === 'DEVELOPER' || u.role === 'TEAM_LEAD');
    return ok(
      users.map((u) => {
        const tasks = mockTasks.filter((t) => t.assigneeId === u.id);
        return {
          userId: u.id,
          name: u.name,
          role: u.role,
          title: u.title,
          total: tasks.length,
          inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
          inReview: tasks.filter((t) => t.status === 'IN_REVIEW').length,
          completed: tasks.filter((t) => t.status === 'COMPLETED').length,
          overdue: tasks.filter((t) => {
            if (!t.deadline) return false;
            return new Date(t.deadline).getTime() < Date.now() && t.status !== 'COMPLETED';
          }).length,
        };
      }),
    );
  },
};

export default developerService;
