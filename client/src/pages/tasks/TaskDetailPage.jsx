// =====================================================================
// TaskDetailPage — /tasks/:taskId
//
// Renders the full task detail view per TASK_SYSTEM.md §88:
//   Task Header (ID, Title, Status, Priority, Actions)
//   Task Information (Description, Project, Assignee, Deadline, Estimate)
//
// The Comments / Files / Dependencies / Activity / Reviews sub-modules
// are out of scope for this pass and are intentionally left as
// informational notices so the page still respects the documentation's
// overall layout without expanding into other modules.
// =====================================================================

import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import PageContainer from '../../layouts/PageContainer';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import LoadingState from '../../components/ui/LoadingState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TaskStatusBadge, TaskPriorityBadge } from '../../components/ui/StatusBadge';
import TaskForm from '../../components/tasks/TaskForm';

import taskService from '../../services/taskService';
import developerService from '../../services/developerService';
import projectService from '../../services/projectService';
import { mockUsers, findUserById, findProjectById } from '../../mock/mockData';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import { TASK_STATUS } from '../../utils/constants';
import {
  formatDate,
  formatDateLong,
  formatRelativeTime,
  getDaysUntil,
} from '../../utils/formatDate';

function DeadlineState({ task }) {
  if (!task.deadline) {
    return <span className="text-text-muted text-sm">No deadline set</span>;
  }
  const days = getDaysUntil(task.deadline);
  const overdue =
    task.status !== TASK_STATUS.COMPLETED &&
    task.status !== TASK_STATUS.CANCELLED &&
    days !== null &&
    days < 0;
  const dueToday =
    days === 0 && task.status !== TASK_STATUS.COMPLETED && task.status !== TASK_STATUS.CANCELLED;
  const dueSoon =
    days !== null &&
    days > 0 &&
    days <= 3 &&
    task.status !== TASK_STATUS.COMPLETED &&
    task.status !== TASK_STATUS.CANCELLED;

  let label;
  let tone;
  if (overdue) {
    label = `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
    tone = 'text-danger-light';
  } else if (dueToday) {
    label = 'Due today';
    tone = 'text-warning-light';
  } else if (dueSoon) {
    label = `Due in ${days} day${days === 1 ? '' : 's'}`;
    tone = 'text-warning-light';
  } else if (
    task.status === TASK_STATUS.COMPLETED ||
    task.status === TASK_STATUS.CANCELLED
  ) {
    label = formatDate(task.deadline);
    tone = 'text-text-muted';
  } else {
    label = `${days} day${days === 1 ? '' : 's'} remaining`;
    tone = 'text-text-secondary';
  }

  return (
    <div>
      <div className="text-sm text-text">{formatDateLong(task.deadline)}</div>
      <div className={`text-xs mt-0.5 ${tone}`}>{label}</div>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wide text-text-muted">{label}</div>
      <div className="mt-1 text-sm text-text">{children}</div>
    </div>
  );
}

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();

  const { data, loading, error, refetch } = useAsync(
    () => taskService.get(taskId),
    [taskId],
  );

  const task = data?.data;

  // Load developers so we can resolve the assignee via name/color.
  // Also load projects so the edit form has selectable options.
  // Failures are silent — the page still renders.
  const { data: projectData } = useAsync(() => projectService.list({ limit: 100 }), []);
  const { data: devData } = useAsync(() => developerService.list(), []);

  const projectOptions = useMemo(
    () => (projectData?.data?.items || []).map((p) => ({ id: p.id, name: p.name, code: p.code })),
    [projectData],
  );

  const userOptions = useMemo(() => {
    const set = new Map();
    [...mockUsers, ...(devData?.data?.items || [])].forEach((u) => {
      const id = u.id || u.userId;
      if (!id) return;
      if (!set.has(id)) set.set(id, { id, name: u.name, avatarColor: u.avatarColor, role: u.role });
    });
    return Array.from(set.values());
  }, [devData]);

  const project = useMemo(() => {
    if (!task) return null;
    return findProjectById(task.projectId);
  }, [task]);

  const assignee = useMemo(() => {
    if (!task) return null;
    return (
      userOptions.find((u) => u.id === task.assigneeId) || findUserById(task.assigneeId) || null
    );
  }, [task, userOptions]);

  const canEdit = hasPermission(user, 'task.update');
  const canAssign = hasPermission(user, 'task.assign');
  const canChangeStatus = hasPermission(user, 'task.changeStatus');
  const canDelete = hasPermission(user, 'task.delete');

  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const closeEdit = () => {
    setEditOpen(false);
  };

  const handleEditSubmit = async (values) => {
    if (!task) return;
    setEditSubmitting(true);
    try {
      const res = await taskService.update(task.id, values);
      if (!res?.success) throw new Error(res?.message || 'Update failed');
      push({ type: 'success', message: `Task "${values.title}" updated.` });
      setEditOpen(false);
      refetch();
    } catch (err) {
      push({ type: 'error', message: err.message || 'Could not save the task.' });
    } finally {
      setEditSubmitting(false);
    }
  };

  const askDelete = () => {
    if (!task) return;
    if (!canDelete) {
      push({ type: 'warning', message: 'You do not have permission to delete tasks.' });
      return;
    }
    setConfirm({
      title: 'Delete task',
      message: `Permanently delete "${task.title}"? This cannot be undone in this prototype.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          const res = await taskService.remove(task.id);
          if (!res?.success) throw new Error(res?.message || 'Delete failed');
          push({ type: 'success', message: `Task "${task.title}" deleted.` });
          navigate('/tasks', { replace: true });
        } catch (err) {
          push({ type: 'error', message: err.message || 'Could not delete the task.' });
        } finally {
          setActionLoading(false);
          setConfirm(null);
        }
      },
    });
  };

  const askChangeStatus = () => {
    if (!task) return;
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
    const labels = {
      [TASK_STATUS.BACKLOG]: 'Backlog',
      [TASK_STATUS.TODO]: 'To Do',
      [TASK_STATUS.IN_PROGRESS]: 'In Progress',
      [TASK_STATUS.IN_REVIEW]: 'In Review',
      [TASK_STATUS.REVISION_REQUIRED]: 'Revision Required',
      [TASK_STATUS.COMPLETED]: 'Completed',
      [TASK_STATUS.BLOCKED]: 'Blocked',
      [TASK_STATUS.CANCELLED]: 'Cancelled',
    };
    setConfirm({
      title: 'Change task status',
      message: `Advance "${task.title}" from ${labels[task.status]} to ${labels[next]}?`,
      confirmLabel: 'Change status',
      variant: 'primary',
      action: async () => {
        setActionLoading(true);
        try {
          const res = await taskService.updateStatus(task.id, next);
          if (!res?.success) throw new Error(res?.message || 'Update failed');
          push({ type: 'success', message: `Status set to ${labels[next]}.` });
          refetch();
        } catch (err) {
          push({ type: 'error', message: err.message || 'Could not update status.' });
        } finally {
          setActionLoading(false);
          setConfirm(null);
        }
      },
    });
  };

  if (loading) {
    return (
      <PageContainer
        title="Loading task..."
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Tasks', to: '/tasks' },
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

  if (error || !task) {
    return (
      <PageContainer
        title="Task not found"
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Tasks', to: '/tasks' }]}
      >
        <ErrorState
          title="We could not load this task"
          description={error?.message || 'The task may have been deleted or the ID is incorrect.'}
          onRetry={refetch}
        />
        <div className="mt-3">
          <Link to="/tasks">
            <Button variant="ghost" leftIcon={<Icon name="chevronLeft" size="sm" />}>
              Back to tasks
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const overdue =
    task.status !== TASK_STATUS.COMPLETED &&
    task.status !== TASK_STATUS.CANCELLED &&
    task.deadline &&
    getDaysUntil(task.deadline) < 0;

  const headerActions = (
    <div className="flex items-center gap-2">
      <Link to="/tasks">
        <Button variant="ghost" size="sm" leftIcon={<Icon name="chevronLeft" size="sm" />}>
          Back
        </Button>
      </Link>
      {canChangeStatus && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Icon name="refresh" size="sm" />}
          onClick={askChangeStatus}
        >
          Change status
        </Button>
      )}
      {canEdit && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Icon name="edit" size="sm" />}
          onClick={() => setEditOpen(true)}
        >
          Edit
        </Button>
      )}
      {canDelete && (
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Icon name="trash" size="sm" />}
          onClick={askDelete}
        >
          Delete
        </Button>
      )}
    </div>
  );

  return (
    <PageContainer
      title={task.title}
      subtitle={`${task.code} · ${project ? project.name : 'No project'}`}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Tasks', to: '/tasks' },
        { label: task.code },
      ]}
      actions={headerActions}
    >
      {/* Header card: ID, status, priority, deadline state */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <TaskStatusBadge status={task.status} size="md" />
              <TaskPriorityBadge priority={task.priority} size="md" />
              {overdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-2xs uppercase tracking-wide rounded border border-danger/40 bg-danger-soft text-danger-light">
                  <Icon name="flag" size="sm" />
                  Overdue
                </span>
              )}
              {task.tags && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-bg-hover text-text-secondary border border-border">
                  <Icon name="tag" size="sm" className="mr-1" />
                  {task.tags}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoRow label="Task ID">{task.code}</InfoRow>
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
              <InfoRow label="Assignee">
                {assignee ? (
                  <span className="inline-flex items-center gap-2">
                    <Avatar name={assignee.name} color={assignee.avatarColor} size="sm" />
                    <span className="truncate">{assignee.name}</span>
                  </span>
                ) : (
                  <span className="text-text-muted">Unassigned</span>
                )}
              </InfoRow>
              <InfoRow label="Deadline">
                <DeadlineState task={task} />
              </InfoRow>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Description */}
      <Card padding="md">
        <CardHeader>
          <CardTitle subtitle="What needs to be done, why, and the expected result.">
            Description
          </CardTitle>
        </CardHeader>
        <CardBody>
          {task.description ? (
            <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
              {task.description}
            </p>
          ) : (
            <p className="text-sm text-text-muted italic">No description provided.</p>
          )}
        </CardBody>
      </Card>

      {/* Information grid: meta fields + acceptance criteria */}
      <Card padding="md">
        <CardHeader>
          <CardTitle subtitle="Lifecycle, scheduling, and definition of done.">Information</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoRow label="Status">
              <TaskStatusBadge status={task.status} size="sm" />
            </InfoRow>
            <InfoRow label="Priority">
              <TaskPriorityBadge priority={task.priority} size="sm" />
            </InfoRow>
            <InfoRow label="Estimated hours">
              {task.estimatedHours != null ? `${task.estimatedHours} h` : '—'}
            </InfoRow>
            <InfoRow label="Actual hours">
              {task.actualHours != null ? `${task.actualHours} h` : '—'}
            </InfoRow>
            <InfoRow label="Created">{formatDate(task.createdAt)}</InfoRow>
            <InfoRow label="Updated">
              <span title={formatRelativeTime(task.updatedAt)}>{formatDate(task.updatedAt)}</span>
            </InfoRow>
            <InfoRow label="Completed at">
              {task.completedAt ? formatDate(task.completedAt) : '—'}
            </InfoRow>
            <InfoRow label="Comments">{task.commentCount ?? 0}</InfoRow>
            <InfoRow label="Files">{task.fileCount ?? 0}</InfoRow>
          </div>

          {task.acceptanceCriteria && task.acceptanceCriteria.length > 0 && (
            <div className="mt-5">
              <div className="text-2xs uppercase tracking-wide text-text-muted mb-2">
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
        </CardBody>
      </Card>

      {/* Out-of-scope workspace notice (Comments / Files / Activity / Reviews) */}
      <Card padding="md">
        <CardHeader>
          <CardTitle subtitle="Comments, files, dependencies, activity, and review history.">
            Workspace
          </CardTitle>
        </CardHeader>
        <CardBody>
          <EmptyState
            icon={<Icon name="message" size="md" />}
            title="Workspace coming next"
            description="Comments, file attachments, dependencies, activity log, and review history will appear here as the related modules go online."
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

      <TaskForm
        open={editOpen}
        mode="edit"
        initialValues={task}
        projectOptions={projectOptions}
        assigneeOptions={userOptions}
        canAssign={canAssign}
        onSubmit={handleEditSubmit}
        onClose={closeEdit}
        submitting={editSubmitting}
      />
    </PageContainer>
  );
}
