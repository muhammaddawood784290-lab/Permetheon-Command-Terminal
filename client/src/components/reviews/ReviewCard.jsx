// =====================================================================
// ReviewCard — compact card representation of a review for mobile/grid.
// Mirrors the table's row data 1:1 so swapping between views never
// changes what the user sees.
// =====================================================================

import { Link } from 'react-router-dom';
import { ReviewStatusBadge } from '../ui/StatusBadge';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { findUserById } from '../../mock/mockData';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import { REVIEW_STATUS } from '../../utils/constants';

export default function ReviewCard({ review }) {
  const reviewer = findUserById(review.reviewerId);
  const developer = findUserById(review.assigneeId);

  return (
    <Link
      to={`/reviews/${review.id}`}
      className="block bg-bg-surface border border-border rounded-md p-4 hover:border-border-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-text-muted">Review {review.id}</div>
          <div className="text-sm font-semibold text-text truncate mt-0.5">
            {review.taskTitle || 'Untitled task'}
          </div>
          <div className="text-xs text-text-secondary mt-0.5 truncate">
            <Icon name="folder" size="sm" className="inline -mt-0.5 mr-1 text-text-muted" />
            {review.projectName || '— No project —'}
          </div>
        </div>
        <div className="shrink-0">
          <ReviewStatusBadge status={review.status} size="sm" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {developer ? (
            <>
              <Avatar name={developer.name} color={developer.avatarColor} size="sm" />
              <span className="text-text-secondary truncate">{developer.name}</span>
            </>
          ) : (
            <span className="text-text-muted">No developer</span>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-text-secondary">Attempt {review.attempt || 1}</div>
          {review.submittedAt && (
            <div className="text-2xs text-text-muted mt-0.5" title={formatDate(review.submittedAt)}>
              {formatRelativeTime(review.submittedAt)}
            </div>
          )}
        </div>
      </div>

      {review.feedback && review.feedback.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle text-xs text-text-muted flex items-center gap-1.5">
          <Icon name="message" size="sm" />
          <span className="truncate">
            {review.feedback.length} feedback {review.feedback.length === 1 ? 'note' : 'notes'}
          </span>
          {review.status === REVIEW_STATUS.REVISION_REQUIRED && (
            <span className="ml-auto text-danger-light font-medium">Revision needed</span>
          )}
        </div>
      )}
    </Link>
  );
}