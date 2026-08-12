// =====================================================================
// TaskCard — compact card representation of a task for mobile/grid.
// Mirrors the table's row data 1:1 so swapping between views never
// changes what the user sees.
// =====================================================================

import { Link } from 'react-router-dom';
import { TaskStatusBadge, TaskPriorityBadge } from '../ui/StatusBadge';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { findUserById, findProjectById } from '../../mock/mockData';
import {
  formatDate,
  formatRelativeTime,
  getDaysUntil,
} from '../../utils/formatDate';

function ProgressStatus({ task }) {
  const days = task.deadline ? getDaysUntil(task.deadline) : null;
  const overdue =
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED' &&
    days !== null &&
    days < 0;
  const dueToday = days === 0 && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
  const dueSoon =
    days !== null && days > 0 && days <= 3 && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';

  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1 text-2xs uppercase tracking-wide text-danger-light">
        <Icon name="flag" size="sm" />
        Overdue
      </span>
    );
  }
  if (dueToday) {
    return (
      <span className="inline-flex items-center gap-1 text-2xs uppercase tracking-wide text-warning-light">
        <Icon name="clock" size="sm" />
        Due today
      </span>
    );
  }
  if (dueSoon) {
    return (
      <span className="inline-flex items-center gap-1 text-2xs uppercase tracking-wide text-warning-light">
        <Icon name="clock" size="sm" />
        Due in {days} day{days === 1 ? '' : 's'}
      </span>
    );
  }
  return null;
}

export default function TaskCard({ task, assignee, project, onChangeStatus, onDelete }) {
  const days = task.deadline ? getDaysUntil(task.deadline) : null;
  const overdue =
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED' &&
    days !== null &&
    days < 0;

  return (
    <div className="bg-bg-surface border border-border rounded-md p-4 hover:border-border-strong transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/tasks/${task.id}`}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
          >
            <div className="text-xs text-text-muted">{task.code}</div>
            <div className="text-sm font-semibold text-text truncate">{task.title}</div>
          </Link>
          {project && (
            <Link
              to={`/projects/${project.id}`}
              className="text-xs text-text-secondary hover:text-text truncate inline-flex items-center gap-1 mt-0.5"
            >
              <Icon name="folder" size="sm" className="text-text-muted" />
              <span className="truncate">{project.code} · {project.name}</span>
            </Link>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <TaskStatusBadge status={task.status} size="sm" />
          <TaskPriorityBadge priority={task.priority} size="sm" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {assignee ? (
            <>
              <Avatar name={assignee.name} color={assignee.avatarColor} size="sm" />
              <span className="text-text-secondary truncate">{assignee.name}</span>
            </>
          ) : (
            <span className="text-text-muted">Unassigned</span>
          )}
        </div>
        <div className="text-right shrink-0">
          {task.deadline && (
            <div className={overdue ? 'text-danger-light' : 'text-text-secondary'}>
              {formatDate(task.deadline)}
            </div>
          )}
          <ProgressStatus task={task} />
          {!overdue && task.deadline && (
            <div className="text-2xs text-text-muted">{formatRelativeTime(task.deadline)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function resolveTaskRelations(task, users) {
  const assignee = users.find((u) => u.id === task.assigneeId) || findUserById(task.assigneeId);
  const project = findProjectById(task.projectId);
  return { assignee, project };
}
