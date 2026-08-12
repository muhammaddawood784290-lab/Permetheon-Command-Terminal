// =====================================================================
// NotificationContext — single source of truth for the current user's
// notifications. Both the topbar bell and the `/notifications` page
// read from this context so they always agree on state.
//
// The provider scopes every operation by `userId` taken from
// AuthContext. On logout, the user's notifications are cleared and
// the bell badge resets to zero.
// =====================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const DEFAULT_FILTERS = Object.freeze({
  search: '',
  type: 'all',
  read: 'all',
  targetType: 'all',
  sort: 'createdAt',
  order: 'desc',
});

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const refresh = useCallback(
    async (overrideFilters = null) => {
      if (!userId) {
        setNotifications([]);
        return;
      }
      const effectiveFilters = overrideFilters || filters;
      setLoading(true);
      try {
        const res = await notificationService.list({
          userId,
          ...effectiveFilters,
          limit: 100,
        });
        setNotifications(res.data.items);
      } catch {
        // Keep existing state on failure.
      } finally {
        setLoading(false);
      }
    },
    [userId, filters],
  );

  const markAsRead = useCallback(
    async (id) => {
      if (!userId) return;
      // Optimistic update so the badge and the list both react immediately.
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      try {
        await notificationService.markAsRead(id, { userId });
      } catch {
        /* optimistic */
      }
    },
    [userId],
  );

  const markAsUnread = useCallback(
    async (id) => {
      if (!userId) return;
      setNotifications((current) =>
        current.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
      try {
        await notificationService.markAsUnread(id, { userId });
      } catch {
        /* optimistic */
      }
    },
    [userId],
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllAsRead({ userId });
    } catch {
      /* optimistic */
    }
  }, [userId]);

  const remove = useCallback(
    async (id) => {
      if (!userId) return;
      setNotifications((current) => current.filter((n) => n.id !== id));
      try {
        await notificationService.remove(id, { userId });
      } catch {
        /* optimistic */
      }
    },
    [userId],
  );

  const clearRead = useCallback(async () => {
    if (!userId) return;
    setNotifications((current) => current.filter((n) => !n.read));
    try {
      await notificationService.clearRead({ userId });
    } catch {
      /* optimistic */
    }
  }, [userId]);

  // Re-fetch whenever the user (de)logs in.
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }
    refresh();
  }, [userId, refresh]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      filters,
      setFilters,
      refresh,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      remove,
      clearRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      filters,
      refresh,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      remove,
      clearRead,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>.');
  return ctx;
}

export { DEFAULT_FILTERS };
export default NotificationContext;
