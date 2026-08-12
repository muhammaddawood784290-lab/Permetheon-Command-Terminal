// =====================================================================
// NotificationList — grouped, scrollable list of notifications.
// The parent owns the notification array and the action handlers; this
// component is purely presentational so the same markup is used by the
// topbar bell dropdown, the notifications page, and any future dense
// view (mobile sheet, command palette, etc.).
//
// Items are grouped by day ("Today", "Yesterday", "Earlier this week",
// "Older") so users can scan a long inbox quickly.
// =====================================================================

import { useMemo } from 'react';
import NotificationItem from './NotificationItem';
import EmptyState from '../ui/EmptyState';
import Icon from '../ui/Icon';
import { isToday, getDaysUntil } from '../../utils/formatDate';

function toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function groupKey(date, now = new Date()) {
  if (!date) return 'Older';
  if (isToday(date, now)) return 'Today';
  const diffDays = getDaysUntil(date, now);
  // getDaysUntil computes ceil((date - now)/day). For past dates it's
  // negative; -1 means yesterday, -2..-6 means earlier this week.
  if (diffDays === -1) return 'Yesterday';
  if (diffDays >= -6 && diffDays <= -2) return 'Earlier this week';
  return 'Older';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier this week', 'Older'];

function groupNotifications(list) {
  const now = new Date();
  const buckets = new Map();
  list.forEach((n) => {
    const d = toDate(n.createdAt);
    const key = groupKey(d, now);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(n);
  });

  return GROUP_ORDER.filter((key) => buckets.has(key)).map((key) => ({
    key,
    items: buckets.get(key),
  }));
}

export default function NotificationList({
  notifications = [],
  loading = false,
  emptyTitle = 'No notifications',
  emptyDescription = 'You are all caught up — new updates will appear here.',
  emptyAction,
  onMarkAsRead,
  onMarkAsUnread,
  onRemove,
  showActions = true,
  className,
}) {
  const groups = useMemo(() => groupNotifications(notifications), [notifications]);

  if (loading) {
    return (
      <div className={className} role="status" aria-label="Loading notifications">
        <div className="bg-bg-surface border border-border rounded-md p-4">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-md bg-bg-hover animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 w-1/3 bg-bg-hover rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-bg-hover rounded animate-pulse mt-2" />
                  <div className="h-3 w-1/2 bg-bg-hover rounded animate-pulse mt-1.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <EmptyState
        className={className}
        icon={<Icon name="bell" size="md" />}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div
      className={className}
      role="list"
      aria-label="Notifications"
    >
      {groups.map((group) => (
        <section key={group.key} className="mb-4 last:mb-0">
          <header className="px-4 py-2 text-2xs uppercase tracking-wide text-text-muted bg-bg-elevated/40 border-b border-border-subtle rounded-t-md">
            {group.key}
          </header>
          <div className="bg-bg-surface border border-border-subtle border-t-0 rounded-b-md overflow-hidden">
            {group.items.map((notification, idx) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onMarkAsUnread={onMarkAsUnread}
                onRemove={onRemove}
                showActions={showActions}
                className={idx === group.items.length - 1 ? 'border-b-0' : undefined}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
