// =====================================================================
// ReviewStats — KPI row across the top of the Reviews queue.
// Pulls live counts from reviewService.stats() and exposes
// click-through links so the queue can be filtered by status.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '../ui/Card';
import Icon from '../ui/Icon';
import reviewService from '../../services/reviewService';
import { REVIEW_STATUS } from '../../utils/constants';

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

export default function ReviewStats({ refreshKey = 0 }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reviewService
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
        icon: 'review',
        label: 'Total reviews',
        value: stats?.total ?? 0,
        sub: 'Across the workspace',
        tone: 'primary',
        to: '/reviews',
      },
      {
        icon: 'inbox',
        label: 'Pending',
        value: stats?.pending ?? 0,
        sub: 'Awaiting reviewer pickup',
        tone: 'info',
        to: `/reviews?status=${REVIEW_STATUS.SUBMITTED}`,
      },
      {
        icon: 'activity',
        label: 'In Review',
        value: stats?.inReview ?? 0,
        sub: 'Active decisions',
        tone: 'primary',
        to: `/reviews?status=${REVIEW_STATUS.IN_REVIEW}`,
      },
      {
        icon: 'flag',
        label: 'Revision required',
        value: stats?.revisionRequired ?? 0,
        sub: 'Back to developer',
        tone: 'danger',
        to: `/reviews?status=${REVIEW_STATUS.REVISION_REQUIRED}`,
      },
      {
        icon: 'check',
        label: 'Approved',
        value: stats?.approved ?? 0,
        sub: 'Shipped work',
        tone: 'success',
        to: `/reviews?status=${REVIEW_STATUS.APPROVED}`,
      },
      {
        icon: 'refresh',
        label: 'Resubmitted',
        value: stats?.resubmitted ?? 0,
        sub: 'Second pass',
        tone: 'warning',
        to: `/reviews?status=${REVIEW_STATUS.RESUBMITTED}`,
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