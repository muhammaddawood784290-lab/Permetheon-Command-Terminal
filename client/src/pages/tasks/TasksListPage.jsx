// =====================================================================
// TasksListPage — /tasks
// Full task list with search, filters, sort, create flow, and
// permission-aware actions. The mock data swap in Phase 2 only touches
// taskService.
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

import TaskStats from '../../components/tasks/TaskStats';
import TaskFilters from '../../components/tasks/TaskFilters';
import TaskTable from '../../components/tasks/TaskTable';
import TaskCard from '../../components/tasks/TaskCard';
import TaskForm from '../../components/tasks/TaskForm';

import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import developerService from '../../services/developerService';
import { mockUsers } from '../../mock/mockData';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import { TASK_STATUS, TASK_STATUS_LABELS, SORT_DIR, ROLE } from '../../utils/constants';

const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  priority: 'all',
  projectId: 'all',
  assigneeId: 'all',
  deadline: 'all',
  sort: 'updatedAt',
  order: SORT_DIR.DESC,
  page: 1,
  limit: 50,
};

export default function TasksListPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // ----- filters / search (URL-aware where possible) ----------------
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [status, setStatus] = useState(() => searchParams.get('status') || 'all');
  const [priority, setPriority] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [assigneeId, setAssigneeId] = useState('all');
  const [deadline, setDeadline] = useState('all');
  const [review, setReview] = useState('all');
  const [sort, setSort] = useState('updatedAt');
  const [order, setOrder] = useState(SORT_DIR.DESC);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync status / overdue / projectId to the URL so deep-links and
  // stats cards can drive the list.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (status && status !== 'all') next.set('status', status);
    else next.delete('status');
    if (deadline === 'overdue' || searchParams.get('overdue') === '1') {
      next.set('overdue', '1');
    } else {
      next.delete('overdue');
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, deadline]);

  // Mirror external URL changes (e.g. clicking a stats card while
  // already on the page) back into local state.
  useEffect(() => {
    const urlStatus = searchParams.get('status') || 'all';
    setStatus((prev) => (prev === urlStatus ? prev : urlStatus));
    const urlOverdue = searchParams.get('overdue');
    if (urlOverdue === '1') {
      setDeadline((prev) => (prev === 'overdue' ? prev : 'overdue'));
    } else if (searchParams.get('status') == null) {
      // only clear when nothing else is pinning us
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status,
      priority,
      projectId,
      assigneeId,
      deadline,
      review,
      sort,
      order,
      page: 1,
      limit: 50,
    }),
    [
      debouncedSearch,
      status,
      priority,
      projectId,
      assigneeId,
      deadline,
      review,
      sort,
      order,
    ],
  );

  const { data, loading, error, refetch } = useAsync(
    () => taskService.list(filters),
    [JSON.stringify(filters), refreshKey],
  );

  const items = data?.data?.items || [];
  const totalCount = data?.data?.total || 0;

  // ----- project / assignee picker data -----------------------------
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
        list.push({ id: u.userId || u.id, name: u.name, avatarColor: u.avatarColor });
      }
    });
    return list;
  }, [devData]);

  // Build assignee options. Anyone with role TEAM_LEAD or DEVELOPER
  // can be assigned a task.
  const assigneeOptions = useMemo(() => {
    const set = new Map();
    mockUsers.forEach((u) => {
      if (u.role === ROLE.ADMIN || u.role === ROLE.TEAM_LEAD || u.role === ROLE.DEVELOPER) {
        set.set(u.id, { id: u.id, name: u.name });
      }
    });
    (devData?.data?.items || []).forEach((u) =>
      set.set(u.userId || u.id, { id: u.userId || u.id, name: u.name }),
    );
    return Array.from(set.values());
  }, [devData]);

  // ----- filter locally by reviewer-pending etc (service doesn't yet)
  const visibleTasks = useMemo(() => {
    let list = items;
    const now = new Date();

    if (projectId === 'unassigned') {
      list = list.filter((t) => !t.projectId);
    }
    if (assigneeId === 'unassigned') {
      list = list.filter((t) => !t.assigneeId);
    }
    if (deadline === 'overdue') {
      list = list.filter((t) => {
        if (!t.deadline) return false;
        return (
          new Date(t.deadline).getTime() < now.getTime() &&
          t.status !== 'COMPLETED' &&
          t.status !== 'CANCELLED'
        );
      });
    } else if (deadline === 'today') {
      list = list.filter((t) => {
        if (!t.deadline) return false;
        const d = new Date(t.deadline);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      });
    } else if (deadline === 'week') {
      const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      list = list.filter((t) => {
        if (!t.deadline) return false;
        const d = new Date(t.deadline);
        return d >= now && d <= weekEnd;
      });
    } else if (deadline === 'none') {
      list = list.filter((t) => !t.deadline);
    }

    if (review && review !== 'all') {
      list = list.filter((t) => {
        const inReview = t.status === 'IN_REVIEW';
        const revision = t.status === 'REVISION_REQUIRED';
        const completed = t.status === 'COMPLETED';
        if (review === 'pending') return t.status === 'IN_PROGRESS';
        if (review === 'in_review') return inReview;
        if (review === 'approved') return completed;
        if (review === 'revision') return revision;
        if (review === 'none') return !t.reviewCount || t.reviewCount === 0;
        return true;
      });
    }

    return list;
  }, [items, projectId, assigneeId, deadline, review]);

  // ----- create / edit flow -----------------------------------------
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = hasPermission(user, 'task.create');
  const canEdit = hasPermission(user, 'task.update');
  const canAssign = hasPermission(user, 'task.assign');
  const canChangeStatus = hasPermission(user, 'task.changeStatus');
  const canDelete = hasPermission(user, 'task.delete');

  const openCreate = () => {
    if (!canCreate) {
      push({ type: 'warning', message: 'You do not have permission to create tasks.' });
      return;
    }
    setEditingTask(null);
    setFormOpen(true);
  };

  const openEdit = (task) => {
    if (!canEdit) {
      push({ type: 'warning', message: 'You do not have permission to edit tasks.' });
      return;
    }
    setEditingTask(task);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingTask) {
        const res = await taskService.update(editingTask.id, values, { actor: user });
        if (!res?.success) throw new Error(res?.message || 'Update failed');
        push({ type: 'success', message: `Task "${values.title}" updated.` });
      } else {
        const res = await taskService.create({
          ...values,
          creatorId: values.creatorId || user?.id,
        }, { actor: user });
        if (!res?.success) throw new Error(res?.message || 'Create failed');
        push({ type: 'success', message: `Task "${values.title}" created.` });
      }
      closeForm();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      push({ type: 'error', message: err.message || 'Could not save the task.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ----- confirm dialogs (status + delete) --------------------------
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const askDelete = (task) => {
    if (!canDelete) {
      push({ type: 'warning', message: 'You do not have permission to delete tasks.' });
      return;
    }
    setConfirm({
      title: 'Delete task',
      message: `Permanently delete "${task.title}"? This cannot be undone in this prototype.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      taskTitle: task.title,
      action: async () => {
        setActionLoading(true);
        try {
          const res = await taskService.remove(task.id, { actor: user });
          if (!res?.success) throw new Error(res?.message || 'Delete failed');
          push({ type: 'success', message: `Task "${task.title}" deleted.` });
          setRefreshKey((k) => k + 1);
        } catch (err) {
          push({ type: 'error', message: err.message || 'Could not delete the task.' });
        } finally {
          setActionLoading(false);
          setConfirm(null);
        }
      },
    });
  };

  const askChangeStatus = (task) => {
    if (!canChangeStatus) {
      push({ type: 'warning', message: 'You do not have permission to change task status.' });
      return;
    }
    const order2 = [
      TASK_STATUS.BACKLOG,
      TASK_STATUS.TODO,
      TASK_STATUS.IN_PROGRESS,
      TASK_STATUS.IN_REVIEW,
      TASK_STATUS.REVISION_REQUIRED,
      TASK_STATUS.COMPLETED,
      TASK_STATUS.BLOCKED,
      TASK_STATUS.CANCELLED,
    ];
    const idx = order2.indexOf(task.status);
    const next = order2[(idx + 1) % order2.length];
    setConfirm({
      title: 'Change task status',
      message: `Move "${task.title}" from ${TASK_STATUS_LABELS[task.status]} to ${TASK_STATUS_LABELS[next]}?`,
      confirmLabel: 'Change status',
      variant: 'primary',
      action: async () => {
        setActionLoading(true);
        try {
          const res = await taskService.updateStatus(task.id, next, { actor: user });
          if (!res?.success) throw new Error(res?.message || 'Update failed');
          push({
            type: 'success',
            message: `Status set to ${TASK_STATUS_LABELS[next]}.`,
          });
          setRefreshKey((k) => k + 1);
        } catch (err) {
          push({ type: 'error', message: err.message || 'Could not update status.' });
        } finally {
          setActionLoading(false);
          setConfirm(null);
        }
      },
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatus('all');
    setPriority('all');
    setProjectId('all');
    setAssigneeId('all');
    setDeadline('all');
    setReview('all');
  };

  const hasFilters =
    Boolean(searchInput) ||
    (status && status !== 'all') ||
    (priority && priority !== 'all') ||
    (projectId && projectId !== 'all') ||
    (assigneeId && assigneeId !== 'all') ||
    (deadline && deadline !== 'all') ||
    (review && review !== 'all');

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Icon name="refresh" size="sm" />}
        onClick={() => setRefreshKey((k) => k + 1)}
        aria-label="Refresh tasks"
      >
        Refresh
      </Button>
      {canCreate && (
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Icon name="plus" size="sm" />}
          onClick={openCreate}
        >
          New task
        </Button>
      )}
    </div>
  );

  return (
    <PageContainer
      title="Tasks"
      subtitle="All tasks across projects. Filter by status, priority, project, or assignee."
      actions={headerActions}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Tasks' },
      ]}
    >
      <TaskStats refreshKey={refreshKey} />

      <Card padding="md">
        <CardBody>
          <TaskFilters
            search={searchInput}
            onSearchChange={setSearchInput}
            status={status}
            onStatusChange={setStatus}
            priority={priority}
            onPriorityChange={setPriority}
            projectId={projectId}
            onProjectChange={setProjectId}
            projectOptions={projectOptions}
            assigneeId={assigneeId}
            onAssigneeChange={setAssigneeId}
            assigneeOptions={assigneeOptions}
            deadline={deadline}
            onDeadlineChange={setDeadline}
            review={review}
            onReviewChange={setReview}
            sort={sort}
            onSortChange={setSort}
            order={order}
            onOrderChange={setOrder}
            onReset={handleResetFilters}
            totalCount={totalCount}
            filteredCount={visibleTasks.length}
          />
        </CardBody>
      </Card>

      {/* Desktop table */}
      <div className="hidden md:block">
        {error ? (
          <ErrorState
            title="Could not load tasks"
            description={error.message}
            onRetry={refetch}
          />
        ) : (
          <TaskTable
            tasks={visibleTasks}
            users={users}
            user={user}
            loading={loading}
            onEdit={openEdit}
            onDelete={askDelete}
            onChangeStatus={askChangeStatus}
          />
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        {error ? (
          <ErrorState
            title="Could not load tasks"
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
        ) : visibleTasks.length === 0 ? (
          <EmptyState
            icon={<Icon name="checkSquare" size="md" />}
            title={hasFilters ? 'No tasks match these filters' : 'No tasks yet'}
            description={
              hasFilters
                ? 'Try clearing the search or status filter.'
                : 'Create your first task to start tracking work.'
            }
            action={
              canCreate && !hasFilters ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Icon name="plus" size="sm" />}
                  onClick={openCreate}
                >
                  New task
                </Button>
              ) : hasFilters ? (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assignee={users.find((u) => u.id === task.assigneeId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop empty state when no results but loaded successfully */}
      {!loading && !error && visibleTasks.length === 0 && (
        <div className="hidden md:block">
          <EmptyState
            icon={<Icon name="checkSquare" size="md" />}
            title={hasFilters ? 'No tasks match these filters' : 'No tasks yet'}
            description={
              hasFilters
                ? 'Try clearing the search or status filter.'
                : 'Create your first task to start tracking work.'
            }
            action={
              canCreate && !hasFilters ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Icon name="plus" size="sm" />}
                  onClick={openCreate}
                >
                  New task
                </Button>
              ) : hasFilters ? (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        </div>
      )}

      <TaskForm
        open={formOpen}
        mode={editingTask ? 'edit' : 'create'}
        initialValues={editingTask}
        projectOptions={projectOptions}
        assigneeOptions={assigneeOptions}
        defaultProjectId={
          projectId && projectId !== 'all' && projectId !== 'unassigned' ? projectId : null
        }
        defaultAssigneeId={
          assigneeId && assigneeId !== 'all' && assigneeId !== 'unassigned' ? assigneeId : null
        }
        canAssign={canAssign}
        onSubmit={handleSubmit}
        onClose={closeForm}
        submitting={submitting}
      />

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
    </PageContainer>
  );
}

export { DEFAULT_FILTERS };
