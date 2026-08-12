// =====================================================================
// notificationService — fetches and manipulates in-app notifications.
//
// All notifications belong to a single user (notification.userId). The
// service scopes every query by `userId` so a user's data is never
// exposed to anyone else. Stats and counts are also computed against
// the user's own slice.
// =====================================================================

import { ok, fail, paginate, sortBy, search } from './api';
import { mockNotifications } from '../mock/mockData';
import { NOTIFICATION_TYPE, SORT_DIR } from '../utils/constants';

const TYPE_FIELDS = ['type'];
const TEXT_FIELDS = ['title', 'message', 'actorName'];

const scopedByUser = (userId) =>
  mockNotifications.filter((n) => n.userId === userId);

export const notificationService = {
  /**
   * Fetch the current user's notifications with optional filters.
   *
   * params:
   *   userId    - required, scopes the query to this user
   *   search    - free-text term matched against title/message/actorName
   *   type      - single NOTIFICATION_TYPE value or 'all'
   *   read      - 'all' | 'unread' | 'read'
   *   targetType- single target type value or 'all'
   *   page      - 1-based page index
   *   limit     - page size
   *   sort      - field name (createdAt, type, read)
   *   order     - SORT_DIR.ASC | SORT_DIR.DESC
   */
  async list(params = {}) {
    const {
      userId,
      search: term,
      type = 'all',
      read = 'all',
      targetType = 'all',
      page = 1,
      limit = 50,
      sort = 'createdAt',
      order = SORT_DIR.DESC,
    } = params;

    if (!userId) return fail('userId is required.', 400);

    let list = scopedByUser(userId);

    // Read state filter
    if (read === 'unread') {
      list = list.filter((n) => !n.read);
    } else if (read === 'read') {
      list = list.filter((n) => n.read);
    }

    // Type filter
    if (type && type !== 'all') {
      list = list.filter((n) => n.type === type);
    }

    // Target type filter
    if (targetType && targetType !== 'all') {
      list = list.filter((n) => n.targetType === targetType);
    }

    // Free-text search
    if (term) {
      list = search(list, TEXT_FIELDS, term);
    }

    // Sort
    list = sortBy(list, sort, order);

    return ok(paginate(list, { page, limit }));
  },

  /**
   * Returns counts and a per-type breakdown for the user's notifications.
   */
  async getStats({ userId } = {}) {
    if (!userId) return fail('userId is required.', 400);
    const list = scopedByUser(userId);
    const total = list.length;
    const unread = list.filter((n) => !n.read).length;
    const read = total - unread;

    const byType = Object.values(NOTIFICATION_TYPE).reduce((acc, t) => {
      acc[t] = list.filter((n) => n.type === t).length;
      return acc;
    }, {});
    const byTargetType = list.reduce((acc, n) => {
      const key = n.targetType || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return ok({ total, unread, read, byType, byTargetType });
  },

  /**
   * Unread badge count for a user. Returns the count of notifications
   * where `read === false`.
   */
  async getUnreadCount({ userId } = {}) {
    if (!userId) return fail('userId is required.', 400);
    const count = scopedByUser(userId).filter((n) => !n.read).length;
    return ok({ count });
  },

  /**
   * Look up a single notification (scoped to the owner so a user cannot
   * peek at someone else's notification by id).
   */
  async getById(id, { userId } = {}) {
    const n = mockNotifications.find((x) => x.id === id);
    if (!n) return fail('Notification not found.', 404);
    if (userId && n.userId !== userId) {
      return fail('Notification not found.', 404);
    }
    return ok(n);
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id, { userId } = {}) {
    const n = mockNotifications.find((x) => x.id === id);
    if (!n) return fail('Notification not found.', 404);
    if (userId && n.userId !== userId) {
      return fail('Notification not found.', 404);
    }
    n.read = true;
    return ok(n);
  },

  /**
   * Mark a single notification as unread.
   */
  async markAsUnread(id, { userId } = {}) {
    const n = mockNotifications.find((x) => x.id === id);
    if (!n) return fail('Notification not found.', 404);
    if (userId && n.userId !== userId) {
      return fail('Notification not found.', 404);
    }
    n.read = false;
    return ok(n);
  },

  /**
   * Mark every notification for the user as read.
   */
  async markAllAsRead({ userId } = {}) {
    if (!userId) return fail('userId is required.', 400);
    let count = 0;
    mockNotifications.forEach((n) => {
      if (n.userId === userId && !n.read) {
        n.read = true;
        count += 1;
      }
    });
    return ok({ count });
  },

  /**
   * Permanently remove a single notification.
   */
  async remove(id, { userId } = {}) {
    const idx = mockNotifications.findIndex((x) => x.id === id);
    if (idx === -1) return fail('Notification not found.', 404);
    if (userId && mockNotifications[idx].userId !== userId) {
      return fail('Notification not found.', 404);
    }
    mockNotifications.splice(idx, 1);
    return ok({ id });
  },

  /**
   * Clear all read notifications for the user. Useful as an action in
   * the notification center header.
   */
  async clearRead({ userId } = {}) {
    if (!userId) return fail('userId is required.', 400);
    let count = 0;
    for (let i = mockNotifications.length - 1; i >= 0; i -= 1) {
      const n = mockNotifications[i];
      if (n.userId === userId && n.read) {
        mockNotifications.splice(i, 1);
        count += 1;
      }
    }
    return ok({ count });
  },
};

export default notificationService;
