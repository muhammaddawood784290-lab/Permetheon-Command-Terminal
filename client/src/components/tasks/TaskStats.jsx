// =====================================================================
// TaskStats — KPI row across the top of the Tasks page.
// Pulls live counts from taskService.stats() so the values stay in sync
// with whatever filters the list view applies. Clicking a card jumps
// to the list with the matching status filter pre-selected.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../ui/Card';
import Icon from '../ui/Icon';
import taskService from '../../services/taskService';

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

export default function TaskStats({ refreshKey = 0, scope = 'all' }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    taskService
      .stats()
      .then((res) => {
        if (!cancelled) setStats(res?.data || null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const cards = useMemo(
    () => [
      {
        icon: 'checkSquare',
        label: 'Total tasks',
        value: stats?.total ?? 0,
        sub: 'Across the workspace',
        tone: 'primary',
        to: '/tasks',
      },
      {
        icon: 'inbox',
        label: 'To Do',
        value: stats?.todo ?? 0,
        sub: 'Ready to be picked up',
        tone: 'info',
        to: '/tasks?status=TODO',
      },
      {
        icon: 'activity',
        label: 'In Progress',
        value: stats?.inProgress ?? 0,
        sub: 'Active development',
        tone: 'primary',
        to: '/tasks?status=IN_PROGRESS',
      },
      {
        icon: 'review',
        label: 'Pending Review',
        value: stats?.inReview ?? 0,
        sub: 'Awaiting reviewer',
        tone: 'warning',
        to: '/tasks?status=IN_REVIEW',
      },
      {
        icon: 'check',
        label: 'Completed',
        value: stats?.completed ?? 0,
        sub: 'Shipped',
        tone: 'success',
        to: '/tasks?status=COMPLETED',
      },
      {
        icon: 'flag',
        label: 'Overdue',
        value: stats?.overdue ?? 0,
        sub: 'Past deadline',
        tone: 'danger',
        to: '/tasks?overdue=1',
      },
    ],
    [stats],
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <StatCard key={card.label} loading={loading} {...card} />
      ))}
    </div>
  );
}
