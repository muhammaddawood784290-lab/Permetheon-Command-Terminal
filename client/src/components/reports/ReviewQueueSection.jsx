// =====================================================================
// ReviewQueueSection — counters + the longest 12 pending reviews.
// =====================================================================

import Card, { CardHeader, CardTitle, CardBody } from '../ui/Card';
import Icon from '../ui/Icon';
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_STYLES,
} from '../../utils/constants';
import { formatRelativeTime } from '../../utils/formatDate';

const SUMMARY_TONES = {
  submitted: 'text-info-light bg-info-soft border-info/40',
  inReview: 'text-warning-light bg-warning-soft border-warning/40',
  approved: 'text-success-light bg-success-soft border-success/40',
  revisionRequired: 'text-danger-light bg-danger-soft border-danger/40',
  resubmitted: 'text-primary-300 bg-primary-500/10 border-primary-500/40',
};

export default function ReviewQueueSection({ data, loading }) {
  const counts = data?.counts || {};
  const queue = data?.queue || [];
  const queueLength = data?.queueLength ?? queue.length;

  const summary = [
    { key: 'submitted', label: 'Submitted', value: counts.submitted ?? 0 },
    { key: 'inReview', label: 'In review', value: counts.inReview ?? 0 },
    { key: 'approved', label: 'Approved', value: counts.approved ?? 0 },
    { key: 'revisionRequired', label: 'Revision required', value: counts.revisionRequired ?? 0 },
    { key: 'resubmitted', label: 'Resubmitted', value: counts.resubmitted ?? 0 },
  ];

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle subtitle={`${queueLength} review${queueLength === 1 ? '' : 's'} awaiting reviewer action`}>
          Review queue
        </CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-bg-hover rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
              {summary.map((s) => (
                <div
                  key={s.key}
                  className={`rounded border px-3 py-2 ${SUMMARY_TONES[s.key] || ''}`}
                >
                  <div className="text-2xs uppercase tracking-wide opacity-80">{s.label}</div>
                  <div className="text-xl font-semibold">{s.value}</div>
                </div>
              ))}
            </div>

            {queue.length === 0 ? (
              <div className="text-xs text-text-muted text-center py-6 flex flex-col items-center gap-2">
                <Icon name="check" size="md" />
                <span>No pending reviews for these filters.</span>
              </div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {queue.map((review) => (
                  <li key={review.id} className="py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text truncate">{review.taskTitle}</div>
                      <div className="text-2xs text-text-muted truncate">
                        {review.projectName} · Assignee: {review.assigneeName} · Reviewer:{' '}
                        {review.reviewerName}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded border text-2xs uppercase tracking-wide ${
                        REVIEW_STATUS_STYLES[review.status] || 'border-border text-text-muted'
                      }`}
                    >
                      {REVIEW_STATUS_LABELS[review.status] || review.status}
                    </span>
                    <span className="text-2xs text-text-muted whitespace-nowrap">
                      Submitted {formatRelativeTime(review.submittedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
