// =====================================================================
// ReviewQueuePage — /reviews
//
// Full review queue with search, filters, sort, permission-aware actions
// (start, approve, request revision, reassign reviewer), and KPI stats
// up top. Mirrors TasksListPage structure for consistency, but the
// "create" flow is intentionally absent: reviews are created by the
// workflow itself (developer submits task → review record exists),
// not authored manually from this page.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import PageContainer from '../../layouts/PageContainer';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';

import ReviewStats from '../../components/reviews/ReviewStats';
import ReviewFilters from '../../components/reviews/ReviewFilters';
import ReviewTable from '../../components/reviews/ReviewTable';
import ReviewCard from '../../components/reviews/ReviewCard';

import reviewService from '../../services/reviewService';
import projectService from '../../services/projectService';
import developerService from '../../services/developerService';
import { mockUsers } from '../../mock/mockData';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import {
  REVIEW_STATUS,
  ROLE,
  SORT_DIR,
  REVIEW_STATUS_LABELS,
} from '../../utils/constants';

const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  projectId: 'all',
  reviewerId: 'all',
  assigneeId: 'all',
  sort: 'updatedAt',
  order: SORT_DIR.DESC,
  page: 1,
  limit: 50,
};

export default function ReviewQueuePage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // ----- filters / search (URL-aware where possible) ----------------
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [status, setStatus] = useState(() => searchParams.get('status') || 'all');
  const [projectId, setProjectId] = useState('all');
  const [reviewerId, setReviewerId] = useState('all');
  const [assigneeId, setAssigneeId] = useState('all');
  const [sort, setSort] = useState('updatedAt');
  const [order, setOrder] = useState(SORT_DIR.DESC);
  const [scope, setScope] = useState('all'); // all | mine
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync the status filter to the URL so deep links from stats cards work.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (status && status !== 'all') next.set('status', status);
    else next.delete('status');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Mirror external URL changes (e.g. clicking a stats card while on
  // the page) back into local state.
  useEffect(() => {
    const urlStatus = searchParams.get('status') || 'all';
    setStatus((prev) => (prev === urlStatus ? prev : urlStatus));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status,
      projectId,
      reviewerId,
      assigneeId,
      sort,
      order,
      page: 1,
      limit: 50,
      onlyMine: scope === 'mine',
      actorId: user?.id,
    }),
    [
      debouncedSearch,
      status,
      projectId,
      reviewerId,
      assigneeId,
      sort,
      order,
      scope,
      user?.id,
    ],
  );

  const { data, loading, error, refetch } = useAsync(
    () => reviewService.list(filters),
    [JSON.stringify(filters), refreshKey],
  );

  const items = data?.data?.items || [];
  const totalCount = data?.data?.total || 0;

  // ----- option data: projects + developers + reviewers -------------
  const { data: projectData } = useAsync(() => projectService.list({ limit: 100 }), []);
  const projectOptions = useMemo(
    () => (projectData?.data?.items || []).map((p) => ({ id: p.id, code: p.code, name: p.name })),
    [projectData],
  );

  const { data: devData } = useAsync(() => developerService.list(), []);
  const users = useMemo(() => {
    const list = [...mockUsers];
    (devData?.data?.items || []).forEach((u) => {
      if (!list.some((m) => m.id === (u.userId || u.id))) {
        list.push({ id: u.userId || u.id, name: u.name, avatarColor: u.avatarColor, role: u.role });
      }
    });
    return list;
  }, [devData]);

  // Reviewers must hold review.approve or review.start (admin + team lead).
  const reviewerOptions = useMemo(() => {
    const set = new Map();
    mockUsers.forEach((u) => {
      if (u.role === ROLE.ADMIN || u.role === ROLE.TEAM_LEAD) {
        set.set(u.id, { id: u.id, name: u.name });
      }
    });
    (devData?.data?.items || []).forEach((u) =>
      set.set(u.userId || u.id, { id: u.userId || u.id, name: u.name }),
    );
    return Array.from(set.values());
  }, [devData]);

  // Developers include everyone with role DEVELOPER (plus leads for flexibility).
  const assigneeOptions = useMemo(() => {
    const set = new Map();
    mockUsers.forEach((u) => {
      if (
        u.role === ROLE.DEVELOPER ||
        u.role === ROLE.TEAM_LEAD ||
        u.role === ROLE.ADMIN
      ) {
        set.set(u.id, { id: u.id, name: u.name });
      }
    });
    (devData?.data?.items || []).forEach((u) =>
      set.set(u.userId || u.id, { id: u.userId || u.id, name: u.name }),
    );
    return Array.from(set.values());
  }, [devData]);

  // ----- permissions -----------------------------------------------
  const canStart = hasPermission(user, 'review.start');
  const canApprove = hasPermission(user, 'review.approve');
  const canRequestRevision = hasPermission(user, 'review.requestRevision');
  const canAssign = hasPermission(user, 'review.assign');

  // ----- confirm / modal state -------------------------------------
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [revisionFor, setRevisionFor] = useState(null);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [revisionError, setRevisionError] = useState(null);

  const [approveFor, setApproveFor] = useState(null);
  const [approveMessage, setApproveMessage] = useState('');

  const [assignFor, setAssignFor] = useState(null);
  const [assignReviewerId, setAssignReviewerId] = useState('');

  // ----- handlers --------------------------------------------------
  const refresh = () => setRefreshKey((k) => k + 1);

  const handleStart = (review) => {
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

  const openApprove = (review) => {
    if (!canApprove) {
      push({ type: 'warning', message: 'You do not have permission to approve reviews.' });
      return;
    }
    if (user?.id && review.assigneeId === user.id) {
      push({ type: 'warning', message: 'You cannot approve your own work.' });
      return;
    }
    setApproveFor(review);
    setApproveMessage('');
  };

  const submitApprove = async () => {
    if (!approveFor) return;
    setActionLoading(true);
    try {
      const res = await reviewService.approve(approveFor.id, approveMessage, { actor: user });
      if (!res?.success) throw new Error(res?.message || 'Approve failed');
      push({ type: 'success', message: 'Review approved.' });
      setApproveFor(null);
      setApproveMessage('');
      refresh();
    } catch (err) {
      push({ type: 'error', message: err.message || 'Could not approve the review.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openRevision = (review) => {
    if (!canRequestRevision) {
      push({ type: 'warning', message: 'You do not have permission to request revisions.' });
      return;
    }
    setRevisionFor(review);
    setRevisionMessage('');
    setRevisionError(null);
  };

  const submitRevision = async () => {
    if (!revisionFor) return;
    const trimmed = revisionMessage.trim();
    if (!trimmed) {
      setRevisionError('A revision reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await reviewService.requestRevision(revisionFor.id, trimmed, { actor: user });
      if (!res?.success) throw new Error(res?.message || 'Request failed');
      push({ type: 'success', message: 'Revision requested.' });
      setRevisionFor(null);
      setRevisionMessage('');
      setRevisionError(null);
      refresh();
    } catch (err) {
      push({ type: 'error', message: err.message || 'Could not request a revision.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openAssign = (review) => {
    if (!canAssign) {
      push({ type: 'warning', message: 'You do not have permission to reassign reviewers.' });
      return;
    }
    setAssignFor(review);
    setAssignReviewerId(review.reviewerId || '');
  };

  const submitAssign = async () => {
    if (!assignFor) return;
    if (!assignReviewerId) {
      push({ type: 'warning', message: 'Pick a reviewer first.' });
      return;
    }
    setActionLoading(true);
    try {
      const res = await reviewService.assign(assignFor.id, assignReviewerId, { actor: user });
      if (!res?.success) throw new Error(res?.message || 'Reassign failed');
      push({ type: 'success', message: 'Reviewer reassigned.' });
      setAssignFor(null);
      setAssignReviewerId('');
      refresh();
    } catch (err) {
      push({ type: 'error', message: err.message || 'Could not reassign the reviewer.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatus('all');
    setProjectId('all');
    setReviewerId('all');
    setAssigneeId('all');
  };

  const hasFilters =
    Boolean(searchInput) ||
    (status && status !== 'all') ||
    (projectId && projectId !== 'all') ||
    (reviewerId && reviewerId !== 'all') ||
    (assigneeId && assigneeId !== 'all');

  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded-md border border-border bg-bg-elevated overflow-hidden">
        <button
          type="button"
          onClick={() => setScope('all')}
          className={`px-3 h-8 text-xs font-medium ${
            scope === 'all'
              ? 'bg-primary-600/20 text-text'
              : 'text-text-muted hover:text-text hover:bg-bg-hover'
          }`}
        >
          All reviews
        </button>
        <button
          type="button"
          onClick={() => setScope('mine')}
          className={`px-3 h-8 text-xs font-medium border-l border-border ${
            scope === 'mine'
              ? 'bg-primary-600/20 text-text'
              : 'text-text-muted hover:text-text hover:bg-bg-hover'
          }`}
        >
          My reviews
        </button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Icon name="refresh" size="sm" />}
        onClick={refresh}
        aria-label="Refresh reviews"
      >
        Refresh
      </Button>
    </div>
  );

  return (
    <PageContainer
      title="Reviews"
      subtitle="All review decisions across the workspace. Filter by status, project, reviewer, or developer."
      actions={headerActions}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Reviews' },
      ]}
    >
      <ReviewStats refreshKey={refreshKey} />

      <Card padding="md">
        <CardBody>
          <ReviewFilters
            search={searchInput}
            onSearchChange={setSearchInput}
            status={status}
            onStatusChange={setStatus}
            projectId={projectId}
            onProjectChange={setProjectId}
            projectOptions={projectOptions}
            reviewerId={reviewerId}
            onReviewerChange={setReviewerId}
            reviewerOptions={reviewerOptions}
            assigneeId={assigneeId}
            onAssigneeChange={setAssigneeId}
            assigneeOptions={assigneeOptions}
            sort={sort}
            onSortChange={setSort}
            order={order}
            onOrderChange={setOrder}
            onReset={handleResetFilters}
            totalCount={totalCount}
            filteredCount={items.length}
          />
        </CardBody>
      </Card>

      {/* Desktop table */}
      <div className="hidden md:block">
        {error ? (
          <ErrorState
            title="Could not load reviews"
            description={error.message}
            onRetry={refetch}
          />
        ) : (
          <ReviewTable
            reviews={items}
            user={user}
            loading={loading}
            onStart={handleStart}
            onApprove={openApprove}
            onRequestRevision={openRevision}
            onAssign={openAssign}
          />
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        {error ? (
          <ErrorState
            title="Could not load reviews"
            description={error.message}
            onRetry={refetch}
          />
        ) : loading ? (
          <Card>
            <CardBody>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-md bg-bg-hover animate-pulse" />
                ))}
              </div>
            </CardBody>
          </Card>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Icon name="review" size="md" />}
            title={hasFilters ? 'No reviews match these filters' : 'No reviews yet'}
            description={
              hasFilters
                ? 'Try clearing the search or status filter.'
                : 'Reviews appear here once a developer submits a task for review.'
            }
            action={
              hasFilters ? (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {items.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop empty state when no results but loaded successfully */}
      {!loading && !error && items.length === 0 && (
        <div className="hidden md:block">
          <EmptyState
            icon={<Icon name="review" size="md" />}
            title={hasFilters ? 'No reviews match these filters' : 'No reviews yet'}
            description={
              hasFilters
                ? 'Try clearing the search or status filter.'
                : 'Reviews appear here once a developer submits a task for review.'
            }
            action={
              hasFilters ? (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          variant={confirm.variant}
          loading={actionLoading}
          onConfirm={confirm.action}
          onClose={() => !actionLoading && setConfirm(null)}
        />
      )}

      {/* Approve dialog (with optional message) */}
      {approveFor && (
        <Modal
          open={!!approveFor}
          onClose={() => !actionLoading && setApproveFor(null)}
          title="Approve review"
          description={`Approve "${approveFor.taskTitle}"? You can include a short note.`}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setApproveFor(null)} disabled={actionLoading}>
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

      {/* Request revision modal (mandatory reason) */}
      {revisionFor && (
        <Modal
          open={!!revisionFor}
          onClose={() => !actionLoading && setRevisionFor(null)}
          title="Request revision"
          description={`Send "${revisionFor.taskTitle}" back to the developer with notes on what to change.`}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setRevisionFor(null)} disabled={actionLoading}>
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

      {/* Reassign reviewer modal */}
      {assignFor && (
        <Modal
          open={!!assignFor}
          onClose={() => !actionLoading && setAssignFor(null)}
          title="Reassign reviewer"
          description={`Pick a new reviewer for "${assignFor.taskTitle}".`}
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setAssignFor(null)} disabled={actionLoading}>
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
            onChange={(e) => setAssignReviewerId(e.target.value)}
            options={[
              { value: '', label: '— Select reviewer —' },
              ...reviewerOptions.map((u) => ({ value: u.id, label: u.name })),
            ]}
            required
          />
        </Modal>
      )}
    </PageContainer>
  );
}

export { DEFAULT_FILTERS };