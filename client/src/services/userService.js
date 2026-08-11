// =====================================================================
// userService — fetches user-related data (admin user management).
// =====================================================================

import { ok, fail, paginate, applyFilters, search, sortBy } from './api';
import { mockUsers, findUserById } from '../mock/mockData';

export const userService = {
  async list(params = {}) {
    const { page = 1, limit = 20, search: term, role, status } = params;
    let list = [...mockUsers];
    if (role && role !== 'all') list = applyFilters(list, { role });
    if (status && status !== 'all') list = applyFilters(list, { status });
    if (term) list = search(list, ['name', 'email', 'title'], term);
    list = sortBy(list, 'name', 'asc');
    return ok(paginate(list, { page, limit }));
  },

  async get(id) {
    const user = findUserById(id);
    if (!user) return fail('User not found.', 404);
    return ok(user);
  },

  async developers() {
    // Phase 2: replace with GET /api/developers
    return ok(mockUsers.filter((u) => u.role === 'DEVELOPER' || u.role === 'TEAM_LEAD'));
  },

  async workload() {
    return ok(
      mockUsers.map((u) => ({
        userId: u.id,
        name: u.name,
        role: u.role,
        activeTasks: 0,
      })),
    );
  },

  async update(id, payload) {
    const user = findUserById(id);
    if (!user) return fail('User not found.', 404);
    Object.assign(user, payload);
    return ok(user);
  },

  async changeRole(id, role) {
    const user = findUserById(id);
    if (!user) return fail('User not found.', 404);
    user.role = role;
    return ok(user);
  },

  async changeStatus(id, status) {
    const user = findUserById(id);
    if (!user) return fail('User not found.', 404);
    user.status = status;
    return ok(user);
  },
};

export default userService;
