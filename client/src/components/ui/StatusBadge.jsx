// =====================================================================
// StatusBadge — domain-aware Badge for tasks, projects, reviews, users.
// =====================================================================

import Badge from './Badge';
import {
  TASK_STATUS,
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
  TASK_PRIORITY,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_STYLES,
  REVIEW_STATUS,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_STYLES,
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
  ROLE,
  ROLE_LABELS,
  ROLE_STYLES,
  USER_STATUS,
  USER_STATUS_LABELS,
  USER_STATUS_STYLES,
} from '../../utils/constants';

export function TaskStatusBadge({ status, size = 'md' }) {
  const label = TASK_STATUS_LABELS[status] || status;
  const styles = TASK_STATUS_STYLES[status] || '';
  return (
    <Badge size={size} className={`${styles} normal-case`}>
      {label}
    </Badge>
  );
}

export function TaskPriorityBadge({ priority, size = 'md' }) {
  const label = TASK_PRIORITY_LABELS[priority] || priority;
  const styles = TASK_PRIORITY_STYLES[priority] || '';
  return (
    <Badge size={size} className={`${styles} normal-case`}>
      {label}
    </Badge>
  );
}

export function ReviewStatusBadge({ status, size = 'md' }) {
  const label = REVIEW_STATUS_LABELS[status] || status;
  const styles = REVIEW_STATUS_STYLES[status] || '';
  return (
    <Badge size={size} className={`${styles} normal-case`}>
      {label}
    </Badge>
  );
}

export function ProjectStatusBadge({ status, size = 'md' }) {
  const label = PROJECT_STATUS_LABELS[status] || status;
  const styles = PROJECT_STATUS_STYLES[status] || '';
  return (
    <Badge size={size} className={`${styles} normal-case`}>
      {label}
    </Badge>
  );
}

export function RoleBadge({ role, size = 'md' }) {
  const label = ROLE_LABELS[role] || role;
  const styles = ROLE_STYLES[role] || '';
  return (
    <Badge size={size} className={`${styles} normal-case`}>
      {label}
    </Badge>
  );
}

export function UserStatusBadge({ status, size = 'md' }) {
  const label = USER_STATUS_LABELS[status] || status;
  const styles = USER_STATUS_STYLES[status] || '';
  return (
    <Badge size={size} className={`${styles} normal-case`}>
      {label}
    </Badge>
  );
}
