// =====================================================================
// userService — fetches and manages workspace users.
//
// Phase 1: served from mockUsers + mockActivity. Mutations are pushed
// straight into the mock arrays so the rest of the UI (notifications,
// activity timeline, projects) sees the change immediately. Phase 2
// only needs to swap the bodies of these methods — the public shape
// stays stable.
//
// Self-protection rules (per ROLE_PERMESSIONS.md §41):
//   • Users cannot deactivate themselves.
//   • Users cannot demote themselves.
//   • The last remaining ADMIN cannot be demoted.
//   • Email must be unique across the workspace.
// All checks live here so any caller (UI, API gateway, future E2E) sees
// the same server-side behaviour.
// =====================================================================

import { ok, fail, paginate, applyFilters, search, sortBy } from './api';
import {
  mockUsers,
  mockTasks,
  findUserById,
} from '../mock/mockData';
import {
  ACTIVITY_ACTION,
  ROLE,
  USER_STATUS,
} from '../utils/constants';
import { recordActivity } from './activityHelpers';

const AVATAR_PALETTE = [
  '#3b6ff4', '#a16207', '#2a55d6', '#15803d', '#0369a1',
  '#b91c1c', '#7c3aed', '#db2777', '#475569', '#0891b2',
  '#be185d', '#65a30d',
];

function nextId() {
  let max = 0;
  for (const u of mockUsers) {
    const n = Number(String(u.id).replace(/[^0-9]/g, ''));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `u_${max + 1}`;
}

function isEmailTaken(email, { excludeId } = {}) {
  const target = String(email || '').trim().toLowerCase();
  if (!target) return false;
  return mockUsers.some(
    (u) => u.id !== excludeId && String(u.email).trim().toLowerCase() === target,
  );
}

function countActiveAdmins() {
  return mockUsers.filter((u) => u.role === ROLE.ADMIN && u.status === USER_STATUS.ACTIVE).length;
}

function buildUserRow(user) {
  const taskCount = mockTasks.filter((t) => t.assigneeId === user.id).length;
  const openTasks = mockTasks.filter(
    (t) =>
      t.assigneeId === user.id &&
      t.status !== 'COMPLETED' &&
      t.status !== 'CANCELLED',
  ).length;
  return {
    ...user,
    taskCount,
    openTasks,
  };
}

export const userService = {
  /**
   * List users with filters / search / sort / pagination.
   */
  async list(params = {}) {
    const {
      page = 1,
      limit = 20,
      search: term,
      role,
      status,
      sort = 'name',
      order = 'asc',
    } = params;

    let list = mockUsers.map(buildUserRow);
    if (role && role !== 'all') list = applyFilters(list, { role });
    if (status && status !== 'all') list = applyFilters(list, { status });
    if (term) list = search(list, ['name', 'email', 'title'], term);
    list = sortBy(list, sort, order);
    return ok(paginate(list, { page, limit }));
  },

  async get(id) {
    const user = findUserById(id);
    if (!user) return fail('User not found.', 404);
    return ok(buildUserRow(user));
  },

  async developers() {
    return ok(
      mockUsers
        .filter((u) => u.role === ROLE.DEVELOPER || u.role === ROLE.TEAM_LEAD)
        .map(buildUserRow),
    );
  },

  async workload() {
    return ok(
      mockUsers.map((u) => ({
        userId: u.id,
        name: u.name,
        role: u.role,
        activeTasks: mockTasks.filter(
          (t) => t.assigneeId === u.id && t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
        ).length,
      })),
    );
  },

  async stats() {
    const total = mockUsers.length;
    const active = mockUsers.filter((u) => u.status === USER_STATUS.ACTIVE).length;
    const inactive = mockUsers.filter((u) => u.status === USER_STATUS.INACTIVE).length;
    const suspended = mockUsers.filter((u) => u.status === USER_STATUS.SUSPENDED).length;

    const byRole = {
      [ROLE.ADMIN]: mockUsers.filter((u) => u.role === ROLE.ADMIN).length,
      [ROLE.TEAM_LEAD]: mockUsers.filter((u) => u.role === ROLE.TEAM_LEAD).length,
      [ROLE.DEVELOPER]: mockUsers.filter((u) => u.role === ROLE.DEVELOPER).length,
    };

    const admins = mockUsers.filter((u) => u.role === ROLE.ADMIN && u.status === USER_STATUS.ACTIVE).length;

    return ok({
      total,
      active,
      inactive,
      suspended,
      byRole,
      activeAdmins: admins,
    });
  },

  async emailExists(email, { excludeId } = {}) {
    return ok(isEmailTaken(email, { excludeId }));
  },

  /**
   * Create a new workspace user. ADMIN only (enforced at the route).
   */
  async create(payload, actor) {
    const name = String(payload?.name || '').trim();
    const email = String(payload?.email || '').trim();
    const role = payload?.role;
    const title = String(payload?.title || '').trim();
    const status = payload?.status || USER_STATUS.ACTIVE;

    if (!name || name.length < 2) return fail('Name must be at least 2 characters.', 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail('A valid email address is required.', 400);
    }
    if (!ROLE[role]) return fail('Pick a valid role.', 400);
    if (isEmailTaken(email)) return fail('A user with this email already exists.', 409);

    const user = {
      id: nextId(),
      name,
      email,
      role,
      status,
      title,
      avatarColor: AVATAR_PALETTE[mockUsers.length % AVATAR_PALETTE.length],
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };
    mockUsers.unshift(user);

    recordActivity({
      action: ACTIVITY_ACTION.USER_CREATED,
      actor,
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.name,
      summary: `${actor?.name || 'Someone'} created user ${user.name}`,
      metadata: { role: user.role, status: user.status },
    });

    return ok(buildUserRow(user));
  },

  /**
   * Update editable profile fields. Role and status are managed via
   * dedicated endpoints so their audit trail is consistent.
   */
  async update(id, payload, actor) {
    const user = findUserById(id);
    if (!user) return fail('User not found.', 404);

    const next = { ...user };
    if (payload?.name !== undefined) {
      const name = String(payload.name).trim();
      if (!name || name.length < 2) return fail('Name must be at least 2 characters.', 400);
      next.name = name;
    }
    if (payload?.email !== undefined) {
      const email = String(payload.email).trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return fail('A valid email address is required.', 400);
      }
      if (isEmailTaken(email, { excludeId: id })) {
        return fail('A user with this email already exists.', 409);
      }
      next.email = email;
    }
    if (payload?.title !== undefined) {
      const title = String(payload.title).trim();
      if (title.length > 80) return fail('Title must be 80 characters or fewer.', 400);
      next.title = title;
    }
    if (payload?.status !== undefined && USER_STATUS[payload.status]) {
      next.status = payload.status;
    }

    const before = { name: user.name, email: user.email, title: user.title, status: user.status };
    Object.assign(user, next);

    recordActivity({
      action: ACTIVITY_ACTION.USER_UPDATED,
      actor,
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.name,
      summary: `${actor?.name || 'Someone'} updated user ${user.name}`,
      metadata: { before, after: { name: user.name, email: user.email, title: user.title, status: user.status } },
    });

    return ok(buildUserRow(user));
  },

  /**
   * Change a user's role. Enforces:
   *   • User cannot change their own role.
   *   • The last active ADMIN cannot be demoted.
   */
  async changeRole(id, role, actor) {
    const user = findUserById(id);
    if (!user) return fail('User not found.', 404);
    if (!ROLE[role]) return fail('Pick a valid role.', 400);

    if (actor?.id === user.id) {
      return fail('You cannot change your own role.', 403);
    }
    if (user.role === ROLE.ADMIN && role !== ROLE.ADMIN && countActiveAdmins() <= 1) {
      return fail('Cannot demote the last administrator.', 409);
    }

    const from = user.role;
    user.role = role;

    recordActivity({
      action: ACTIVITY_ACTION.USER_ROLE_CHANGED,
      actor,
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.name,
      summary: `${actor?.name || 'Someone'} changed role of ${user.name} from ${from} to ${role}`,
      metadata: { from, to: role },
    });

    return ok(buildUserRow(user));
  },

  /**
   * Change a user's status. Used for both activate and deactivate.
   * Users cannot deactivate themselves.
   */
  async changeStatus(id, status, actor) {
    const user = findUserById(id);
    if (!user) return fail('User not found.', 404);
    if (!USER_STATUS[status]) return fail('Pick a valid status.', 400);

    if (actor?.id === user.id && status !== USER_STATUS.ACTIVE) {
      return fail('You cannot deactivate your own account.', 403);
    }
    if (user.role === ROLE.ADMIN && user.status === USER_STATUS.ACTIVE && status !== USER_STATUS.ACTIVE && countActiveAdmins() <= 1) {
      return fail('Cannot deactivate the last administrator.', 409);
    }

    const from = user.status;
    user.status = status;

    const action =
      status === USER_STATUS.INACTIVE || status === USER_STATUS.SUSPENDED
        ? ACTIVITY_ACTION.USER_DEACTIVATED
        : ACTIVITY_ACTION.USER_REACTIVATED;

    recordActivity({
      action,
      actor,
      targetType: 'user',
      targetId: user.id,
      targetLabel: user.name,
      summary:
        status === USER_STATUS.ACTIVE
          ? `${actor?.name || 'Someone'} reactivated user ${user.name}`
          : `${actor?.name || 'Someone'} ${status === USER_STATUS.SUSPENDED ? 'suspended' : 'deactivated'} user ${user.name}`,
      metadata: { from, to: status },
    });

    return ok(buildUserRow(user));
  },

  /**
   * Convenience helpers — `deactivate` and `activate` map to the
   * correct status transitions so the UI doesn't have to know.
   */
  async deactivate(id, actor) {
    return this.changeStatus(id, USER_STATUS.INACTIVE, actor);
  },

  async activate(id, actor) {
    return this.changeStatus(id, USER_STATUS.ACTIVE, actor);
  },

  /**
   * Build the role options the current actor is allowed to assign to
   * a given target. Used by the role-change dialog to hide impossible
   * transitions.
   */
  rolesAvailableFor(target, actor) {
    // Non-admins shouldn't reach the UI at all, but defend anyway.
    if (actor?.role !== ROLE.ADMIN) return [];
    const all = Object.values(ROLE);
    // The user can't change their own role.
    if (actor?.id === target?.id) return [];
    // If target is currently the last admin we can't offer a non-admin role.
    if (
      target?.role === ROLE.ADMIN &&
      countActiveAdmins() <= 1
    ) {
      return [ROLE.ADMIN];
    }
    return all;
  },
};

export default userService;
