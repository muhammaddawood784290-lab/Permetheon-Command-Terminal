// =====================================================================
// TaskTable — desktop tabular view of tasks.
// Rendered side-by-side with TaskCard; the parent chooses which to
// show via the viewport.
//
// Actions menu is permission-aware: developers only see the "View"
// action, while Admin/Team Lead see Edit, Change Status, and Delete
// where their permission set allows it.
// =====================================================================

import { Link, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Table, THead, TBody, TR, TH, TD, TEmpty } from '../ui/Table';
import { TaskStatusBadge, TaskPriorityBadge } from '../ui/StatusBadge';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { findUserById, findProjectById } from '../../mock/mockData';
import { formatDate, getDaysUntil } from '../../utils/formatDate';
import { hasPermission } from '../../utils/permissions';

function StatusCell({ task }) {
  const days = task.deadline ? getDaysUntil(task.deadline) : null;
  const overdue =
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED' &&
    days !== null &&
    days < 0;
  const dueToday = days === 0 && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
  const dueSoon =
    days !== null &&
    days > 0 &&
    days <= 3 &&
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED';

  let indicator = null;
  if (overdue) {
    indicator = (
      <span className="text-2xs uppercase tracking-wide text-danger-light ml-1">Overdue</span>
    );
  } else if (dueToday) {
    indicator = (
      <span className="text-2xs uppercase tracking-wide text-warning-light ml-1">Due today</span>
    );
  } else if (dueSoon) {
    indicator = (
      <span className="text-2xs uppercase tracking-wide text-warning-light ml-1">
        Due in {days}d
      </span>
    );
  }

  return (
    <div className="flex items-center flex-wrap gap-1.5">
      <TaskStatusBadge status={task.status} size="sm" />
      {indicator}
    </div>
  );
}

function DeadlineCell({ task }) {
  if (!task.deadline) {
    return <span className="text-text-muted text-xs">—</span>;
  }
  const days = getDaysUntil(task.deadline);
  const overdue =
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED' &&
    days !== null &&
    days < 0;
  const dueToday = days === 0 && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
  return (
    <span
      className={`text-xs whitespace-nowrap ${
        overdue ? 'text-danger-light' : dueToday ? 'text-warning-light' : 'text-text-secondary'
      }`}
      title={task.deadline}
    >
      {formatDate(task.deadline)}
    </span>
  );
}

function AssigneeCell({ task, users }) {
  const assignee = users.find((u) => u.id === task.assigneeId) || findUserById(task.assigneeId);
  if (!assignee) {
    return <span className="text-text-muted text-xs">Unassigned</span>;
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar name={assignee.name} color={assignee.avatarColor} size="sm" />
      <span className="text-xs text-text truncate">{assignee.name}</span>
    </div>
  );
}

function ProjectCell({ task }) {
  const project = findProjectById(task.projectId);
  if (!project) {
    return <span className="text-text-muted text-xs">—</span>;
  }
  return (
    <div className="min-w-0">
      <div className="text-2xs text-text-muted">{project.code}</div>
      <div className="text-xs text-text-secondary truncate max-w-[14rem]">{project.name}</div>
    </div>
  );
}

function ActionsCell({ task, user, onEdit, onDelete, onChangeStatus }) {
  const navigate = useNavigate();
  const trigger = (
    <button
      type="button"
      aria-label={`Open actions for ${task.title}`}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-text-muted hover:text-text hover:bg-bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      <Icon name="more" size="sm" />
    </button>
  );

  const canEdit = hasPermission(user, 'task.update');
  const canChangeStatus = hasPermission(user, 'task.changeStatus');
  const canDelete = hasPermission(user, 'task.delete');

  return (
    <Dropdown trigger={trigger} align="right">
      <DropdownItem
        leftIcon={<Icon name="checkSquare" size="sm" />}
        onClick={() => navigate(`/tasks/${task.id}`)}
      >
        View details
      </DropdownItem>
      {canChangeStatus && (
        <DropdownItem
          leftIcon={<Icon name="refresh" size="sm" />}
          onClick={() => onChangeStatus?.(task)}
        >
          Change status
        </DropdownItem>
      )}
      {canEdit && (
        <DropdownItem leftIcon={<Icon name="edit" size="sm" />} onClick={() => onEdit?.(task)}>
          Edit task
        </DropdownItem>
      )}
      {canDelete && (
        <>
          <DropdownSeparator />
          <DropdownItem
            leftIcon={<Icon name="trash" size="sm" />}
            onClick={() => onDelete?.(task)}
            danger
          >
            Delete
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}

export default function TaskTable({
  tasks,
  users = [],
  user,
  loading = false,
  onEdit,
  onDelete,
  onChangeStatus,
}) {
  const navigate = useNavigate();
  const rows = useMemo(() => tasks || [], [tasks]);

  return (
    <div className="bg-bg-surface border border-border rounded-md overflow-hidden">
      <Table>
        <THead>
          <TR>
            <TH className="w-[28%]">Task</TH>
            <TH>Project</TH>
            <TH>Status</TH>
            <TH>Priority</TH>
            <TH>Assignee</TH>
            <TH>Deadline</TH>
            <TH>Updated</TH>
            <TH align="right" className="w-[60px]">
              <span className="sr-only">Actions</span>
            </TH>
          </TR>
        </THead>
        <TBody>
          {loading ? (
            <TEmpty colSpan={8}>
              <div className="flex items-center justify-center gap-2 text-text-muted">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
                Loading tasks...
              </div>
            </TEmpty>
          ) : rows.length === 0 ? (
            <TEmpty colSpan={8}>No tasks match the current filters.</TEmpty>
          ) : (
            rows.map((task) => (
              <TR key={task.id}>
                <TD>
                  <Link
                    to={`/tasks/${task.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
                  >
                    <div className="text-2xs text-text-muted">{task.code}</div>
                    <div className="text-sm text-text font-medium truncate">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-text-muted truncate max-w-[28rem] mt-0.5">
                        {task.description}
                      </div>
                    )}
                    {task.tags && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded bg-bg-hover text-text-secondary border border-border">
                          {task.tags}
                        </span>
                      </div>
                    )}
                  </Link>
                </TD>
                <TD>
                  <ProjectCell task={task} />
                </TD>
                <TD>
                  <StatusCell task={task} />
                </TD>
                <TD>
                  <TaskPriorityBadge priority={task.priority} size="sm" />
                </TD>
                <TD>
                  <AssigneeCell task={task} users={users} />
                </TD>
                <TD>
                  <DeadlineCell task={task} />
                </TD>
                <TD>
                  <span className="text-xs text-text-muted">{formatDate(task.updatedAt)}</span>
                </TD>
                <TD align="right">
                  <ActionsCell
                    task={task}
                    user={user}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onChangeStatus={onChangeStatus}
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
