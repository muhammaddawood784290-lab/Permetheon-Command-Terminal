// =====================================================================
// ReviewTable — desktop tabular view of reviews.
// Renders side-by-side with ReviewCard; the parent chooses which to
// show via the viewport. Actions menu is permission-aware:
//   - "View" is available to anyone with review.view
//   - "Start" requires review.start
//   - "Approve" / "Request revision" require the respective permission
// =====================================================================

import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Table, THead, TBody, TR, TH, TD, TEmpty } from '../ui/Table';
import { ReviewStatusBadge } from '../ui/StatusBadge';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { findUserById } from '../../mock/mockData';
import { formatDate } from '../../utils/formatDate';
import { hasPermission } from '../../utils/permissions';
import { REVIEW_STATUS } from '../../utils/constants';

function AssigneeCell({ review }) {
  const developer = findUserById(review.assigneeId);
  if (!developer) {
    return <span className="text-text-muted text-xs">Unassigned</span>;
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar name={developer.name} color={developer.avatarColor} size="sm" />
      <span className="text-xs text-text truncate">{developer.name}</span>
    </div>
  );
}

function ReviewerCell({ review }) {
  const reviewer = findUserById(review.reviewerId);
  if (!reviewer) {
    return <span className="text-text-muted text-xs">—</span>;
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar name={reviewer.name} color={reviewer.avatarColor} size="sm" />
      <span className="text-xs text-text-secondary truncate">{reviewer.name}</span>
    </div>
  );
}

function ActionsCell({ review, user, onStart, onApprove, onRequestRevision, onAssign }) {
  const navigate = useNavigate();

  const trigger = (
    <button
      type="button"
      aria-label={`Open actions for review ${review.id}`}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-text-muted hover:text-text hover:bg-bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      <Icon name="more" size="sm" />
    </button>
  );

  const canStart = hasPermission(user, 'review.start');
  const canApprove = hasPermission(user, 'review.approve');
  const canRequestRevision = hasPermission(user, 'review.requestRevision');
  const canAssign = hasPermission(user, 'review.assign');

  const startable =
    canStart &&
    (review.status === REVIEW_STATUS.SUBMITTED || review.status === REVIEW_STATUS.RESUBMITTED);
  const decidable =
    review.status === REVIEW_STATUS.IN_REVIEW ||
    review.status === REVIEW_STATUS.RESUBMITTED;

  // Authors cannot approve their own work (matches backend guard).
  const isOwnWork = user?.id && review.assigneeId === user.id;
  const allowApprove = canApprove && decidable && !isOwnWork;
  const allowRevision = canRequestRevision && decidable;

  if (!startable && !allowApprove && !allowRevision && !canAssign) {
    return null;
  }

  return (
    <Dropdown trigger={trigger} align="right">
      <DropdownItem
        leftIcon={<Icon name="review" size="sm" />}
        onClick={() => navigate(`/reviews/${review.id}`)}
      >
        View details
      </DropdownItem>
      {startable && (
        <DropdownItem
          leftIcon={<Icon name="refresh" size="sm" />}
          onClick={() => onStart?.(review)}
        >
          Start review
        </DropdownItem>
      )}
      {canAssign && (
        <DropdownItem
          leftIcon={<Icon name="users" size="sm" />}
          onClick={() => onAssign?.(review)}
        >
          Reassign reviewer
        </DropdownItem>
      )}
      {(allowApprove || allowRevision) && <DropdownSeparator />}
      {allowApprove && (
        <DropdownItem
          leftIcon={<Icon name="check" size="sm" />}
          onClick={() => onApprove?.(review)}
        >
          Approve
        </DropdownItem>
      )}
      {allowRevision && (
        <DropdownItem
          leftIcon={<Icon name="edit" size="sm" />}
          onClick={() => onRequestRevision?.(review)}
        >
          Request revision
        </DropdownItem>
      )}
    </Dropdown>
  );
}

export default function ReviewTable({
  reviews,
  user,
  loading = false,
  onStart,
  onApprove,
  onRequestRevision,
  onAssign,
}) {
  const rows = useMemo(() => reviews || [], [reviews]);

  return (
    <div className="bg-bg-surface border border-border rounded-md overflow-hidden">
      <Table>
        <THead>
          <TR>
            <TH className="w-[28%]">Task</TH>
            <TH>Project</TH>
            <TH>Status</TH>
            <TH>Attempt</TH>
            <TH>Developer</TH>
            <TH>Reviewer</TH>
            <TH>Submitted</TH>
            <TH>Updated</TH>
            <TH align="right" className="w-[60px]">
              <span className="sr-only">Actions</span>
            </TH>
          </TR>
        </THead>
        <TBody>
          {loading ? (
            <TEmpty colSpan={9}>
              <div className="flex items-center justify-center gap-2 text-text-muted">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
                Loading reviews...
              </div>
            </TEmpty>
          ) : rows.length === 0 ? (
            <TEmpty colSpan={9}>No reviews match the current filters.</TEmpty>
          ) : (
            rows.map((review) => (
              <TR key={review.id}>
                <TD>
                  <button
                    type="button"
                    onClick={() => onStart?.(review)}
                    className="block text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
                    aria-label={`Open review ${review.id}`}
                  >
                    <div className="text-2xs text-text-muted">Review {review.id}</div>
                    <div className="text-sm text-text font-medium truncate">
                      {review.taskTitle || 'Untitled task'}
                    </div>
                  </button>
                </TD>
                <TD>
                  <div className="min-w-0">
                    <div className="text-xs text-text-secondary truncate max-w-[14rem]">
                      {review.projectName || '—'}
                    </div>
                  </div>
                </TD>
                <TD>
                  <ReviewStatusBadge status={review.status} size="sm" />
                </TD>
                <TD>
                  <span className="text-xs text-text-secondary">{review.attempt || 1}</span>
                </TD>
                <TD>
                  <AssigneeCell review={review} />
                </TD>
                <TD>
                  <ReviewerCell review={review} />
                </TD>
                <TD>
                  <span className="text-xs text-text-muted">{formatDate(review.submittedAt)}</span>
                </TD>
                <TD>
                  <span className="text-xs text-text-muted">{formatDate(review.updatedAt)}</span>
                </TD>
                <TD align="right">
                  <ActionsCell
                    review={review}
                    user={user}
                    onStart={onStart}
                    onApprove={onApprove}
                    onRequestRevision={onRequestRevision}
                    onAssign={onAssign}
                  />
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}