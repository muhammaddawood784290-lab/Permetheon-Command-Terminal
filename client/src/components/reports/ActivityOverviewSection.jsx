// =====================================================================
// ActivityOverviewSection — counts per activity category + the top
// individual actions inside the current filter scope.
// =====================================================================

import Card, { CardHeader, CardTitle, CardBody } from '../ui/Card';
import { ACTIVITY_ACTION_LABELS } from '../../utils/constants';
import { cn } from '../../utils/cn';

const CATEGORY_LABELS = {
  AUTH: 'Authentication',
  USER: 'Users',
  PROJECT: 'Projects',
  TASK: 'Tasks',
  COMMENT: 'Comments',
  REVIEW: 'Reviews',
  FILE: 'Files',
  NOTIFICATION: 'Notifications',
  SYSTEM: 'System',
  OTHER: 'Other',
};

const CATEGORY_COLORS = {
  AUTH: 'bg-info-500',
  USER: 'bg-primary-500',
  PROJECT: 'bg-warning-500',
  TASK: 'bg-primary-500',
  COMMENT: 'bg-info-500',
  REVIEW: 'bg-success-500',
  FILE: 'bg-warning-500',
  NOTIFICATION: 'bg-neutral-500',
  SYSTEM: 'bg-danger-500',
  OTHER: 'bg-text-muted',
};

export default function ActivityOverviewSection({ data, loading }) {
  const byCategory = data?.byCategory || {};
  const byAction = data?.byAction || {};
  const total = data?.total ?? 0;

  const categoryData = Object.entries(byCategory)
    .map(([cat, value]) => ({
      key: cat,
      label: CATEGORY_LABELS[cat] || cat,
      value,
      tone: CATEGORY_COLORS[cat] || 'bg-primary-500',
    }))
    .sort((a, b) => b.value - a.value);
  const categoryMax = categoryData.reduce((acc, r) => (r.value > acc ? r.value : acc), 0) || 1;

  const topActions = Object.entries(byAction)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([action, value]) => ({
      label: ACTIVITY_ACTION_LABELS[action] || action,
      value,
    }));

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle subtitle={`${total} activity events in scope`}>
          Activity overview
        </CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-bg-hover rounded animate-pulse" />
            ))}
          </div>
        ) : total === 0 ? (
          <div className="text-xs text-text-muted text-center py-6">
            No activity recorded for these filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs uppercase tracking-wide text-text-muted mb-2">
                By category
              </h4>
              <div className="flex flex-col gap-2.5">
                {categoryData.map((row) => {
                  const pct = (row.value / categoryMax) * 100;
                  return (
                    <div key={row.key} className="flex items-center gap-3 text-xs">
                      <div className="w-28 shrink-0 text-text-secondary truncate">{row.label}</div>
                      <div className="flex-1 h-2 rounded-full bg-bg-hover overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', row.tone)}
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <div className="w-10 shrink-0 text-right font-mono tabular-nums text-text">
                        {row.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wide text-text-muted mb-2">
                Top actions
              </h4>
              <ul className="space-y-1 text-xs">
                {topActions.length === 0 ? (
                  <li className="text-text-muted">No actions recorded.</li>
                ) : (
                  topActions.map((a) => (
                    <li key={a.label} className="flex items-center gap-2">
                      <span className="flex-1 truncate text-text-secondary">{a.label}</span>
                      <span className="font-mono tabular-nums text-text">{a.value}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}