// =====================================================================
// NotificationStats — KPI strip across the top of the notifications
// page. Pulls live totals from notificationService.getStats() and
// exposes click-through deep links so the page can be filtered by
// read state or type.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../ui/Card';
import Icon from '../ui/Icon';
import notificationService from '../../services/notificationService';
import { NOTIFICATION_TYPE, NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_ICONS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

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

export default function NotificationStats({ refreshKey = 0 }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setStats(null);
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    notificationService
      .getStats({ userId })
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
  }, [userId, refreshKey]);

  const cards = useMemo(() => {
    const base = [
      {
        icon: 'bell',
        label: 'Total',
        value: stats?.total ?? 0,
        sub: 'Notifications for you',
        tone: 'primary',
        to: '/notifications',
      },
      {
        icon: 'message',
        label: 'Unread',
        value: stats?.unread ?? 0,
        sub: 'Awaiting your attention',
        tone: 'info',
        to: '/notifications?read=unread',
      },
      {
        icon: 'check',
        label: 'Read',
        value: stats?.read ?? 0,
        sub: 'Already seen',
        tone: 'success',
        to: '/notifications?read=read',
      },
      {
        icon: 'flag',
        label: 'Overdue',
        value: stats?.byType?.[NOTIFICATION_TYPE.TASK_OVERDUE] ?? 0,
        sub: 'Tasks past due',
        tone: 'danger',
        to: `/notifications?type=${NOTIFICATION_TYPE.TASK_OVERDUE}`,
      },
      {
        icon: 'review',
        label: 'Review requests',
        value: stats?.byType?.[NOTIFICATION_TYPE.REVIEW_REQUESTED] ?? 0,
        sub: 'Awaiting a decision',
        tone: 'primary',
        to: `/notifications?type=${NOTIFICATION_TYPE.REVIEW_REQUESTED}`,
      },
      {
        icon: 'star',
        label: 'Mentions',
        value: stats?.byType?.[NOTIFICATION_TYPE.MENTION] ?? 0,
        sub: 'Conversations calling you',
        tone: 'warning',
        to: `/notifications?type=${NOTIFICATION_TYPE.MENTION}`,
      },
    ];
    return base;
  }, [stats]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <StatCard key={card.label} loading={loading} {...card} />
      ))}
    </div>
  );
}

export { NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_ICONS };
