// =====================================================================
// ActivityStats — KPI strip across the top of the activity page.
// Reads from ActivityContext so the cards stay in sync with the
// filters and the timeline below; clicking a card sets a deep-link
// filter so the page narrows to that category.
// =====================================================================

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../ui/Card';
import Icon from '../ui/Icon';
import { useActivity } from '../../context/ActivityContext';
import {
  ACTIVITY_ACTION_CATEGORY_LABELS,
  ACTIVITY_ACTION_CATEGORY_MAP,
  ACTIVITY_ACTION_CATEGORY,
} from '../../utils/constants';

const TONE_CLASSES = {
  primary: 'bg-primary-500/10 text-primary-300',
  success: 'bg-success-soft text-success-light',
  warning: 'bg-warning-soft text-warning-light',
  danger: 'bg-danger-soft text-danger-light',
  info: 'bg-info-soft text-info-light',
  neutral: 'bg-bg-hover text-text-secondary',
};

function StatCard({ icon, label, value, sub, tone = 'primary', to, loading }) {
  const content = (
    <Card className="h-full hover:border-border-strong transition-colors">
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-text-muted">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-text">
              {loading ? (
                <span className="inline-block h-7 w-10 bg-bg-hover rounded animate-pulse" />
              ) : (
                value
              )}
            </div>
            {sub && <div className="text-xs text-text-muted mt-1 truncate">{sub}</div>}
          </div>
          <div
            className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${
              TONE_CLASSES[tone] || TONE_CLASSES.primary
            }`}
          >
            <Icon name={icon} size="md" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
  return to ? (
    <Link
      to={to}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-md"
    >
      {content}
    </Link>
  ) : (
    content
  );
}

// Build a deep link that toggles a single action filter on the page.
function actionLink(action) {
  // The page reads `actions` as a comma-separated list in the URL.
  return `/activity?actions=${action}`;
}

function categoryLink(category) {
  // The page maps a category to every action in that category.
  return `/activity?category=${category}`;
}

export default function ActivityStats() {
  const { stats, statsLoading } = useActivity();

  const taskActions = useMemo(
    () => Object.entries(stats.byAction || {})
      .filter(([action]) => ACTIVITY_ACTION_CATEGORY_MAP[action] === ACTIVITY_ACTION_CATEGORY.TASK)
      .reduce((sum, [, count]) => sum + count, 0),
    [stats],
  );

  const reviewActions = useMemo(
    () => Object.entries(stats.byAction || {})
      .filter(([action]) => ACTIVITY_ACTION_CATEGORY_MAP[action] === ACTIVITY_ACTION_CATEGORY.REVIEW)
      .reduce((sum, [, count]) => sum + count, 0),
    [stats],
  );

  const projectActions = useMemo(
    () => Object.entries(stats.byAction || {})
      .filter(([action]) => ACTIVITY_ACTION_CATEGORY_MAP[action] === ACTIVITY_ACTION_CATEGORY.PROJECT)
      .reduce((sum, [, count]) => sum + count, 0),
    [stats],
  );

  const topActor = stats.topActors?.[0];

  const cards = [
    {
      icon: 'activity',
      label: 'Total events',
      value: stats.totals.total,
      sub: `${stats.totals.uniqueActors} actors · ${stats.totals.uniqueActions} action types`,
      tone: 'primary',
      to: '/activity',
    },
    {
      icon: 'bolt',
      label: 'Today',
      value: stats.totals.today,
      sub: 'Last 24 hours',
      tone: 'info',
      to: '/activity',
    },
    {
      icon: 'checkSquare',
      label: 'Task events',
      value: taskActions,
      sub: 'Status, assign, complete',
      tone: 'primary',
      to: categoryLink(ACTIVITY_ACTION_CATEGORY.TASK),
    },
    {
      icon: 'review',
      label: 'Review events',
      value: reviewActions,
      sub: 'Submitted, approved, revision',
      tone: 'success',
      to: categoryLink(ACTIVITY_ACTION_CATEGORY.REVIEW),
    },
    {
      icon: 'folder',
      label: 'Project events',
      value: projectActions,
      sub: 'Created, updated, archived',
      tone: 'warning',
      to: categoryLink(ACTIVITY_ACTION_CATEGORY.PROJECT),
    },
    {
      icon: 'users',
      label: 'Top actor',
      value: topActor?.count ?? 0,
      sub: topActor?.actorName || 'No activity yet',
      tone: 'neutral',
      to: topActor ? `/activity?actor=${topActor.actorId}` : '/activity',
    },
  ];

  // Some cards (assigned, completed, etc.) deserve their own row too —
  // surface the top 3 single-action cards after the totals.
  const topActions = useMemo(
    () => Object.entries(stats.byAction || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3),
    [stats],
  );

  const actionCardMeta = {
    TASK_ASSIGNED: { icon: 'checkSquare', label: 'Assigned', tone: 'info' },
    TASK_COMPLETED: { icon: 'check', label: 'Completed', tone: 'success' },
    TASK_STATUS_CHANGED: { icon: 'refresh', label: 'Status changed', tone: 'info' },
    TASK_SUBMITTED: { icon: 'review', label: 'Submitted', tone: 'warning' },
    TASK_APPROVED: { icon: 'check', label: 'Approved', tone: 'success' },
    TASK_REVISION_REQUESTED: { icon: 'edit', label: 'Revisions', tone: 'danger' },
    COMMENT_CREATED: { icon: 'message', label: 'Comments', tone: 'info' },
    FILE_UPLOADED: { icon: 'upload', label: 'Uploads', tone: 'info' },
    PROJECT_CREATED: { icon: 'folder', label: 'Projects created', tone: 'warning' },
    USER_LOGIN: { icon: 'check', label: 'Sign-ins', tone: 'neutral' },
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((card) => (
          <StatCard key={card.label} loading={statsLoading} {...card} />
        ))}
      </div>
      {topActions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          {topActions.map(([action, count]) => {
            const meta = actionCardMeta[action] || {
              icon: 'dots',
              label: action,
              tone: 'neutral',
            };
            return (
              <StatCard
                key={action}
                icon={meta.icon}
                label={meta.label}
                value={count}
                sub="All-time"
                tone={meta.tone}
                to={actionLink(action)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}