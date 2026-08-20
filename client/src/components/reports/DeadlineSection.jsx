// =====================================================================
// DeadlineSection — overdue / due today / due this week buckets.
// =====================================================================

import Card, { CardHeader, CardTitle, CardBody } from '../ui/Card';
import Icon from '../ui/Icon';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';

const TONE_CLASSES = {
  overdue: 'text-danger-light bg-danger-soft border-danger/40',
  dueToday: 'text-warning-light bg-warning-soft border-warning/40',
  dueThisWeek: 'text-info-light bg-info-soft border-info/40',
};

const TONE_ICON = {
  overdue: 'flag',
  dueToday: 'clock',
  dueThisWeek: 'calendar',
};

function BucketList({ items, tone, emptyLabel }) {
  if (!items.length) {
    return (
      <div className="text-xs text-text-muted text-center py-4 flex items-center justify-center gap-2">
        <Icon name="check" size="sm" />
        {emptyLabel}
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border-subtle">
      {items.map((task) => (
        <li key={task.id} className="py-2 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-text truncate">{task.title}</div>
            <div className="text-2xs text-text-muted">
              {task.code || ''} · deadline {formatDate(task.deadline)} ·{' '}
              {formatRelativeTime(task.deadline)}
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded border text-2xs uppercase tracking-wide ${TONE_CLASSES[tone]}`}
          >
            {tone === 'overdue' ? 'Overdue' : tone === 'dueToday' ? 'Today' : 'This week'}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function DeadlineSection({ data, loading }) {
  const counts = data?.counts || {};
  const buckets = [
    {
      key: 'overdue',
      label: 'Overdue',
      items: data?.overdue || [],
      emptyLabel: 'Nothing overdue.',
    },
    {
      key: 'dueToday',
      label: 'Due today',
      items: data?.dueToday || [],
      emptyLabel: 'Nothing due today.',
    },
    {
      key: 'dueThisWeek',
      label: 'Due this week',
      items: data?.dueThisWeek || [],
      emptyLabel: 'Nothing due this week.',
    },
  ];

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle subtitle="Tasks approaching or past their deadline">
          Deadlines
        </CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 bg-bg-hover rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {buckets.map((bucket) => (
              <div key={bucket.key} className="rounded border border-border-subtle p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name={TONE_ICON[bucket.key]} size="sm" />
                  <h4 className="text-xs uppercase tracking-wide text-text-secondary">
                    {bucket.label}
                  </h4>
                  <span className="ml-auto font-mono tabular-nums text-sm text-text">
                    {counts[bucket.key] ?? 0}
                  </span>
                </div>
                <BucketList
                  items={bucket.items.slice(0, 5)}
                  tone={bucket.key}
                  emptyLabel={bucket.emptyLabel}
                />
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}