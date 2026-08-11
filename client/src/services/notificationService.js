// =====================================================================
// notificationService — fetches and manipulates in-app notifications.
// =====================================================================

import { ok, fail, paginate, sortBy } from './api';
import { mockNotifications } from '../mock/mockData';

export const notificationService = {
  async list(params = {}) {
    const { page = 1, limit = 50, onlyUnread = false } = params;
    let list = [...mockNotifications];
    if (onlyUnread) list = list.filter((n) => !n.read);
    list = sortBy(list, 'createdAt', 'desc');
    return ok(paginate(list, { page, limit }));
  },

  async getUnreadCount() {
    return ok({ count: mockNotifications.filter((n) => !n.read).length });
  },

  async markAsRead(id) {
    const n = mockNotifications.find((x) => x.id === id);
    if (!n) return fail('Notification not found.', 404);
    n.read = true;
    return ok(n);
  },

  async markAllAsRead() {
    mockNotifications.forEach((n) => {
      n.read = true;
    });
    return ok({ count: 0 });
  },

  async remove(id) {
    const idx = mockNotifications.findIndex((x) => x.id === id);
    if (idx === -1) return fail('Notification not found.', 404);
    mockNotifications.splice(idx, 1);
    return ok({ id });
  },
};

export default notificationService;
