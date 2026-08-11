// =====================================================================
// NotificationContext — exposes notification list + helpers to the
// topbar, header, and notification center page.
// =====================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import notificationService from '../services/notificationService';
import { mockNotifications } from '../mock/mockData';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [loading, setLoading] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.list({ limit: 100 });
      setNotifications(res.data.items);
    } catch {
      // Keep existing state on failure.
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await notificationService.markAsRead(id);
    } catch {
      /* optimistic */
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch {
      /* optimistic */
    }
  }, []);

  const remove = useCallback(async (id) => {
    setNotifications((current) => current.filter((n) => n.id !== id));
    try {
      await notificationService.remove(id);
    } catch {
      /* optimistic */
    }
  }, []);

  // Re-fetch on mount.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh,
      markAsRead,
      markAllAsRead,
      remove,
    }),
    [notifications, unreadCount, loading, refresh, markAsRead, markAllAsRead, remove],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>.');
  return ctx;
}

export default NotificationContext;
