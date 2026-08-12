// =====================================================================
// ActivityTimeline — grouped, scrollable timeline of activity entries.
//
// Items are grouped by day (Today, Yesterday, Earlier this week,
// Older) so a long timeline stays scannable. The component is dumb
// — it receives the entry list from the parent and renders one
// ActivityItem per entry. The shared empty-state pattern is used so
// "no activity" and "filtered everything out" look different.
// =====================================================================

import { useMemo } from 'react';
import ActivityItem from './ActivityItem';
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
  if (diffDays === -1) return 'Yesterday';
  if (diffDays >= -6 && diffDays <= -2) return 'Earlier this week';
  return 'Older';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier this week', 'Older'];

function groupEntries(list) {
  const now = new Date();
  const buckets = new Map();
  list.forEach((entry) => {
    const d = toDate(entry.createdAt);
    const key = groupKey(d, now);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(entry);
  });

  return GROUP_ORDER.filter((key) => buckets.has(key)).map((key) => ({
    key,
    items: buckets.get(key),
  }));
}

export default function ActivityTimeline({
  entries = [],
  loading = false,
  emptyTitle = 'No activity yet',
  emptyDescription = 'System events will appear here as your team works.',
  emptyAction,
  className,
}) {
  const groups = useMemo(() => groupEntries(entries), [entries]);

  if (loading) {
    return (
      <div className={className} role="status" aria-label="Loading activity">
        <div className="bg-bg-surface border border-border rounded-md p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-bg-hover animate-pulse" />
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

  if (!entries.length) {
    return (
      <EmptyState
        className={className}
        icon={<Icon name="activity" size="md" />}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={className} role="list" aria-label="Activity timeline">
      {groups.map((group) => (
        <section key={group.key} className="mb-4 last:mb-0">
          <header className="px-4 py-2 text-2xs uppercase tracking-wide text-text-muted bg-bg-elevated/40 border-b border-border-subtle rounded-t-md">
            {group.key}
          </header>
          <div className="bg-bg-surface border border-border-subtle border-t-0 rounded-b-md overflow-hidden">
            {group.items.map((entry) => (
              <ActivityItem key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}