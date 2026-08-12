// =====================================================================
// ProjectStats — KPI row across the top of the Projects page.
// Pulls live counts from projectService.stats() so values stay in sync
// with whatever the list view ends up rendering.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../ui/Card';
import Icon from '../ui/Icon';
import projectService from '../../services/projectService';

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
              {loading ? <span className="inline-block h-7 w-10 bg-bg-hover rounded animate-pulse" /> : value}
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
    <Link to={to} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-md">
      {content}
    </Link>
  ) : (
    content
  );
}

export default function ProjectStats({ refreshKey = 0 }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    projectService
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
        icon: 'folder',
        label: 'Total projects',
        value: stats?.total ?? 0,
        sub: 'Across the workspace',
        tone: 'primary',
        to: '/projects',
      },
      {
        icon: 'flag',
        label: 'Active',
        value: stats?.active ?? 0,
        sub: 'Currently being delivered',
        tone: 'success',
        to: '/projects?status=ACTIVE',
      },
      {
        icon: 'checkSquare',
        label: 'Completed',
        value: stats?.completed ?? 0,
        sub: 'Shipped to clients',
        tone: 'neutral',
        to: '/projects?status=COMPLETED',
      },
      {
        icon: 'bell',
        label: 'On hold',
        value: stats?.onHold ?? 0,
        sub: 'Paused for review',
        tone: 'warning',
        to: '/projects?status=ON_HOLD',
      },
      {
        icon: 'clock',
        label: 'Planning',
        value: stats?.planning ?? 0,
        sub: 'Scoping in progress',
        tone: 'info',
        to: '/projects?status=PLANNING',
      },
      {
        icon: 'archive',
        label: 'Archived',
        value: stats?.archived ?? 0,
        sub: 'No longer active',
        tone: 'neutral',
        to: '/projects?status=ARCHIVED',
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