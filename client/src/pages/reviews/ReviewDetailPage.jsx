// =====================================================================
// ReviewDetailPage — /reviews/:reviewId
//
// Full review detail per REVIEW_SYSTEM.md §34. Surfaces the task, the
// project, the developer, the reviewer, the submission timeline, and
// the feedback history (chronological). Decision actions (Start,
// Approve, Request Revision, Reassign) sit in the header and are
// permission-aware:
//   • Start        — review.start
//   • Approve      — review.approve (and reviewer ≠ assignee)
//   • Revision     — review.requestRevision
//   • Reassign     — review.assign
// Destructive or state-changing decisions use ConfirmDialog/Modal.
// =====================================================================

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import PageContainer from '../../layouts/PageContainer';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import LoadingState from '../../components/ui/LoadingState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import { ReviewStatusBadge } from '../../components/ui/StatusBadge';
import { TaskStatusBadge, TaskPriorityBadge } from '../../components/ui/StatusBadge';

import reviewService from '../../services/reviewService';
import taskService from '../../services/taskService';
import developerService from '../../services/developerService';
import { findUserById, findProjectById, mockUsers } from '../../mock/mockData';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import { REVIEW_STATUS, REVIEW_STATUS_LABELS } from '../../utils/constants';
import {
  formatDate,
  formatDateLong,
  formatDateTime,
  formatRelativeTime,
  getDaysUntil,
} from '../../utils/formatDate';

function InfoRow({ label, children }) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-1 text-sm text-text">{children}</div>
    </div>
  );
}

function DecisionRow({ entry }) {
  const actionLabel = {
    approve: 'Approved',
    requestRevision: 'Requested revision',
    start: 'Started review',
    resubmit: 'Resubmitted',
    assign: 'Reassigned reviewer',
  }[entry.action] || entry.action || 'Note';
  const tone = {
    approve: 'text-success-light',
    requestRevision: 'text-danger-light',
    start: 'text-info-light',
    resubmit: 'text-primary-300',
    assign: 'text-warning-light',
  }[entry.action] || 'text-text-secondary';

  return (
    <li className="flex gap-3">
      <Avatar name={entry.authorName} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-text font-medium">{entry.authorName}</span>
          <span className={`text-xs ${tone} font-medium uppercase tracking-wide`}>
            {actionLabel}
          </span>
          <span className="text-xs text-text-muted" title={formatDateTime(entry.createdAt)}>
            {formatRelativeTime(entry.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm text-text-secondary whitespace-pre-line leading-relaxed">
          {entry.message}
        </p>
      </div>
    </li>
  );
}

export default function ReviewDetailPage() {
  const { reviewId } = useParams();
  const { user } = useAuth();
  const { push } = useToast();

  const { data, loading, error, refetch } = useAsync(
    () => reviewService.get(reviewId),
    [reviewId],
  );
  const review = data?.data;

  // Load the related task so the page can show priority / status / etc.
  const { data: taskData } = useAsync(
    () => (review?.taskId ? taskService.get(review.taskId) : Promise.resolve(null)),
    [review?.taskId],
  );
  const task = taskData?.data || null;

  // Load developers so the reassign dialog has all eligible reviewers.
  const { data: devData } = useAsync(() => developerService.list(), []);

  const reviewerOptions = useMemo(() => {
    const set = new Map();
    mockUsers.forEach((u) => set.set(u.id, { id: u.id, name: u.name }));
    (devData?.data?.items || []).forEach((u) =>
      set.set(u.userId || u.id, { id: u.userId || u.id, name: u.name }),
    );
    return Array.from(set.values());
  }, [devData]);

  const project = useMemo(() => {
    if (!review) return null;
    return findProjectById(review.projectId);
  }, [review]);

  const developer = useMemo(() => {
    if (!review) return null;
    return findUserById(review.assigneeId);
  }, [review]);

  const reviewer = useMemo(() => {
    if (!review) return null;
    return findUserById(review.reviewerId);
  }, [review]);

  // ----- permission checks ----------------------------------------
  const canStart = hasPermission(user, 'review.start');
  const canApprove = hasPermission(user, 'review.approve');
  const canRequestRevision = hasPermission(user, 'review.requestRevision');
  const canAssign = hasPermission(user, 'review.assign');

  const startable =
    canStart &&
    (review?.status === REVIEW_STATUS.SUBMITTED ||
      review?.status === REVIEW_STATUS.RESUBMITTED);

  const decidable =
    review?.status === REVIEW_STATUS.IN_REVIEW ||
    review?.status === REVIEW_STATUS.RESUBMITTED;
  const isOwnWork = user?.id && review?.assigneeId === user.id;
  const allowApprove = canApprove && decidable && !isOwnWork;
  const allowRevision = canRequestRevision && decidable;

  // ----- decision modal state -------------------------------------
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveMessage, setApproveMessage] = useState('');

  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [revisionError, setRevisionError] = useState(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignReviewerId, setAssignReviewerId] = useState('');
  const [assignError, setAssignError] = useState(null);

  // ----- handlers -------------------------------------------------
  const refresh = () => refetch();

  const handleStart = () => {
    if (!review) return;
    if (!canStart) {
      push({ type: 'warning', message: 'You do not have permission to start reviews.' });
      return;
    }
    setConfirm({
      title: 'Start review',
      message: `Begin reviewing "${review.taskTitle}"? This moves the review from ${REVIEW_STATUS_LABELS[review.status]} to ${REVIEW_STATUS_LABELS[REVIEW_STATUS.IN_REVIEW]}.`,
      confirmLabel: 'Start review',
      variant: 'primary',
      action: async () => {
        setActionLoading(true);
        try {
          const res = await reviewService.start(review.id, { actor: user });
          if (!res?.success) throw new Error(res?.message || 'Start failed');
          push({ type: 'success', message: 'Review started.' });
          refresh();
        } catch (err) {
          push({ type: 'error', message: err.message || 'Could not start the review.' });
        } finally {
          setActionLoading(false);
          setConfirm(null);
        }
      },
    });
  };

  const openApprove = () => {
    if (!review) return;
    if (!canApprove) {
      push({ type: 'warning', message: 'You do not have permission to approve reviews.' });
      return;
    }
    if (isOwnWork) {
      push({ type: 'warning', message: 'You cannot approve your own work.' });
      return;
    }
    setApproveMessage('');
    setApproveOpen(true);
  };

  const submitApprove = async () => {
    if (!review) return;
    setActionLoading(true);
    try {
      const res = await reviewService.approve(review.id, approveMessage, { actor: user });
      if (!res?.success) throw new Error(res?.message || 'Approve failed');
      push({ type: 'success', message: 'Review approved.' });
      setApproveOpen(false);
      setApproveMessage('');
      refresh();
    } catch (err) {
      push({ type: 'error', message: err.message || 'Could not approve the review.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openRevision = () => {
    if (!review) return;
    if (!canRequestRevision) {
      push({ type: 'warning', message: 'You do not have permission to request revisions.' });
      return;
    }
    setRevisionMessage('');
    setRevisionError(null);
    setRevisionOpen(true);
  };

  const submitRevision = async () => {
    if (!review) return;
    const trimmed = revisionMessage.trim();
    if (!trimmed) {
      setRevisionError('A revision reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await reviewService.requestRevision(review.id, trimmed, { actor: user });
      if (!res?.success) throw new Error(res?.message || 'Request failed');
      push({ type: 'success', message: 'Revision requested.' });
      setRevisionOpen(false);
      setRevisionMessage('');
      setRevisionError(null);
      refresh();
    } catch (err) {
      push({ type: 'error', message: err.message || 'Could not request a revision.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openAssign = () => {
    if (!review) return;
    if (!canAssign) {
      push({ type: 'warning', message: 'You do not have permission to reassign reviewers.' });
      return;
    }
    setAssignReviewerId(review.reviewerId || '');
    setAssignError(null);
    setAssignOpen(true);
  };

  const submitAssign = async () => {
    if (!review) return;
    if (!assignReviewerId) {
      setAssignError('Pick a reviewer first.');
      return;
    }
    if (assignReviewerId === review.assigneeId) {
      setAssignError('Reviewer cannot be the same as the developer.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await reviewService.assign(review.id, assignReviewerId, { actor: user });
      if (!res?.success) throw new Error(res?.message || 'Reassign failed');
      push({ type: 'success', message: 'Reviewer reassigned.' });
      setAssignOpen(false);
      setAssignReviewerId('');
      setAssignError(null);
      refresh();
    } catch (err) {
      push({ type: 'error', message: err.message || 'Could not reassign the reviewer.' });
    } finally {
      setActionLoading(false);
    }
  };

  // ----- render guards -------------------------------------------
  if (loading) {
    return (
      <PageContainer
        title="Loading review..."
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Reviews', to: '/reviews' },
          { label: '...' },
        ]}
      >
        <Card>
          <CardBody>
            <LoadingState rows={4} height="h-12" />
          </CardBody>
        </Card>
      </PageContainer>
    );
  }

  if (error || !review) {
    return (
      <PageContainer
        title="Review not found"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Reviews', to: '/reviews' },
        ]}
      >
        <ErrorState
          title="We could not load this review"
          description={error?.message || 'The review may have been deleted or the ID is incorrect.'}
          onRetry={refresh}
        />
        <div className="mt-3">
          <Link to="/reviews">
            <Button variant="ghost" leftIcon={<Icon name="chevronLeft" size="sm" />}>
              Back to reviews
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  // Deadline state is informational — pulled from the related task so
  // reviewers can see whether the underlying work is overdue.
  const overdue =
    task?.deadline &&
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED' &&
    getDaysUntil(task.deadline) < 0;

  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <Link to="/reviews">
        <Button variant="ghost" size="sm" leftIcon={<Icon name="chevronLeft" size="sm" />}>
          Back
        </Button>
      </Link>
      {startable && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Icon name="refresh" size="sm" />}
          onClick={handleStart}
        >
          Start review
        </Button>
      )}
      {allowApprove && (
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Icon name="check" size="sm" />}
          onClick={openApprove}
        >
          Approve
        </Button>
      )}
      {allowRevision && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Icon name="edit" size="sm" />}
          onClick={openRevision}
        >
          Request revision
        </Button>
      )}
      {canAssign && (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Icon name="users" size="sm" />}
          onClick={openAssign}
        >
          Reassign
        </Button>
      )}
    </div>
  );

  const sortedFeedback = [...(review.feedback || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <PageContainer
      title={review.taskTitle || `Review ${review.id}`}
      subtitle={`Review ${review.id} · ${project ? project.name : 'No project'}`}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Reviews', to: '/reviews' },
        { label: review.id },
      ]}
      actions={headerActions}
    >
      {/* Header card: status + attempt + assignment + deadlines */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <ReviewStatusBadge status={review.status} size="md" />
              {task && (
                <>
                  <span className="text-2xs uppercase tracking-wide text-text-muted">Task</span>
                  <TaskStatusBadge status={task.status} size="sm" />
                  <TaskPriorityBadge priority={task.priority} size="sm" />
                </>
              )}
              <span className="inline-flex items-center px-2 py-0.5 text-2xs uppercase tracking-wide rounded border border-border bg-bg-hover text-text-secondary">
                Attempt {review.attempt || 1}
              </span>
              {overdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs uppercase tracking-wide rounded border border-danger/40 bg-danger-soft text-danger-light">
                  <Icon name="flag" size="sm" />
                  Task overdue
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoRow label="Review ID">{review.id}</InfoRow>
              <InfoRow label="Project">
                {project ? (
                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-text hover:text-primary-300"
                  >
                    <Icon name="folder" size="sm" className="text-text-muted" />
                    <span className="truncate">
                      {project.code} · {project.name}
                    </span>
                  </Link>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </InfoRow>
              <InfoRow label="Developer">
                {developer ? (
                  <span className="inline-flex items-center gap-2">
                    <Avatar
                      name={developer.name}
                      color={developer.avatarColor}
                      size="sm"
                    />
                    <span className="truncate">{developer.name}</span>
                  </span>
                ) : (
                  <span className="text-text-muted">Unassigned</span>
                )}
              </InfoRow>
              <InfoRow label="Reviewer">
                {reviewer ? (
                  <span className="inline-flex items-center gap-2">
                    <Avatar name={reviewer.name} color={reviewer.avatarColor} size="sm" />
                    <span className="truncate">{reviewer.name}</span>
                  </span>
                ) : (
                  <span className="text-text-muted">Not assigned</span>
                )}
              </InfoRow>
              <InfoRow label="Submitted">
                {review.submittedAt ? (
                  <>
                    <div>{formatDateLong(review.submittedAt)}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {formatRelativeTime(review.submittedAt)}
                    </div>
                  </>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </InfoRow>
              <InfoRow label="Last updated">
                {review.updatedAt ? (
                  <span title={formatDateTime(review.updatedAt)}>
                    {formatRelativeTime(review.updatedAt)}
                  </span>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </InfoRow>
              {review.approvedAt && (
                <InfoRow label="Approved at">
                  {formatDate(review.approvedAt)}
                </InfoRow>
              )}
              {review.revisionRequestedAt && (
                <InfoRow label="Revision requested at">
                  {formatDate(review.revisionRequestedAt)}
                </InfoRow>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Submitted work */}
      <Card padding="md">
        <CardHeader>
          <CardTitle subtitle="The deliverable, scope, and acceptance criteria for this review.">
            Submitted work
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div>
              <div className="text-2xs uppercase tracking-wide text-text-muted">Task</div>
              <div className="mt-1 text-sm text-text font-medium">{review.taskTitle}</div>
            </div>
            {task ? (
              <Link
                to={`/tasks/${task.id}`}
                className="inline-flex items-center gap-1 text-xs text-primary-300 hover:text-text"
              >
                Open full task context
                <Icon name="chevronRight" size="sm" />
              </Link>
            ) : null}
            {task?.description ? (
              <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                {task.description}
              </p>
            ) : (
              <p className="text-sm text-text-muted italic">No task description available.</p>
            )}
            {task?.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
              <div>
                <div className="text-2xs uppercase tracking-wide text-text-muted mb-1.5">
                  Acceptance criteria
                </div>
                <ul className="space-y-1.5">
                  {task.acceptanceCriteria.map((c, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-text-secondary"
                    >
                      <span className="mt-0.5 inline-flex items-center justify-center h-4 w-4 rounded border border-border text-text-muted">
                        <Icon name="check" size="sm" />
                      </span>
                      <span className="truncate">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Decision / feedback history */}
      <Card padding="md">
        <CardHeader>
          <CardTitle subtitle="Reviewer decisions and feedback in chronological order.">
            Feedback & decisions
          </CardTitle>
        </CardHeader>
        <CardBody>
          {sortedFeedback.length === 0 ? (
            <EmptyState
              icon={<Icon name="message" size="md" />}
              title="No feedback yet"
              description="Decisions and notes added during the review will appear here."
            />
          ) : (
            <ul className="space-y-4">
              {sortedFeedback.map((entry) => (
                <DecisionRow key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Workspace notice (Files / Comments / Activity live elsewhere) */}
      <Card padding="md">
        <CardHeader>
          <CardTitle subtitle="Files, comments, and activity linked to this task.">
            Workspace
          </CardTitle>
        </CardHeader>
        <CardBody>
          <EmptyState
            icon={<Icon name="folder" size="md" />}
            title="Workspace coming next"
            description="File attachments, threaded comments, and activity history will appear here as the related modules go online."
          />
        </CardBody>
      </Card>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        loading={actionLoading}
        onConfirm={confirm?.action}
        onClose={() => !actionLoading && setConfirm(null)}
      />

      {approveOpen && (
        <Modal
          open={approveOpen}
          onClose={() => !actionLoading && setApproveOpen(false)}
          title="Approve review"
          description={`Approve "${review.taskTitle}"? You can include a short note for the developer.`}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setApproveOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={submitApprove} loading={actionLoading}>
                Approve
              </Button>
            </>
          }
        >
          <Textarea
            label="Note (optional)"
            placeholder="e.g. Approved — responsive layout verified end-to-end."
            value={approveMessage}
            onChange={(e) => setApproveMessage(e.target.value)}
            rows={3}
          />
        </Modal>
      )}

      {revisionOpen && (
        <Modal
          open={revisionOpen}
          onClose={() => !actionLoading && setRevisionOpen(false)}
          title="Request revision"
          description={`Send "${review.taskTitle}" back to the developer with notes on what to change.`}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setRevisionOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={submitRevision} loading={actionLoading}>
                Request revision
              </Button>
            </>
          }
        >
          <Textarea
            label="Reason for revision"
            placeholder="Describe what the developer needs to fix..."
            value={revisionMessage}
            onChange={(e) => {
              setRevisionMessage(e.target.value);
              if (revisionError) setRevisionError(null);
            }}
            rows={4}
            required
            error={revisionError}
          />
        </Modal>
      )}

      {assignOpen && (
        <Modal
          open={assignOpen}
          onClose={() => !actionLoading && setAssignOpen(false)}
          title="Reassign reviewer"
          description={`Pick a new reviewer for "${review.taskTitle}".`}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setAssignOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={submitAssign} loading={actionLoading}>
                Reassign
              </Button>
            </>
          }
        >
          <Select
            label="Reviewer"
            value={assignReviewerId}
            onChange={(e) => {
              setAssignReviewerId(e.target.value);
              if (assignError) setAssignError(null);
            }}
            options={[
              { value: '', label: '— Select reviewer —' },
              ...reviewerOptions.map((u) => ({ value: u.id, label: u.name })),
            ]}
            required
            error={assignError}
            helperText="The reviewer should not be the same person as the developer."
          />
        </Modal>
      )}
    </PageContainer>
  );
}