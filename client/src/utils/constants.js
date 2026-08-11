// =====================================================================
// PCT — Constants
// Central source of truth for static values used across the UI.
// =====================================================================

// ----- Task statuses (per TASK_SYSTEM.md)
export const TASK_STATUS = {
  BACKLOG: 'BACKLOG',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  IN_REVIEW: 'IN_REVIEW',
  REVISION_REQUIRED: 'REVISION_REQUIRED',
  COMPLETED: 'COMPLETED',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED',
};

export const TASK_STATUS_LIST = [
  TASK_STATUS.BACKLOG,
  TASK_STATUS.TODO,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.IN_REVIEW,
  TASK_STATUS.REVISION_REQUIRED,
  TASK_STATUS.COMPLETED,
  TASK_STATUS.BLOCKED,
  TASK_STATUS.CANCELLED,
];

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.BACKLOG]: 'Backlog',
  [TASK_STATUS.TODO]: 'To Do',
  [TASK_STATUS.IN_PROGRESS]: 'In Progress',
  [TASK_STATUS.IN_REVIEW]: 'In Review',
  [TASK_STATUS.REVISION_REQUIRED]: 'Revision Required',
  [TASK_STATUS.COMPLETED]: 'Completed',
  [TASK_STATUS.BLOCKED]: 'Blocked',
  [TASK_STATUS.CANCELLED]: 'Cancelled',
};

export const TASK_STATUS_STYLES = {
  [TASK_STATUS.BACKLOG]: 'text-text-muted bg-bg-hover border-border',
  [TASK_STATUS.TODO]: 'text-info-light bg-info-soft border-info/40',
  [TASK_STATUS.IN_PROGRESS]: 'text-primary-300 bg-primary-500/10 border-primary-500/40',
  [TASK_STATUS.IN_REVIEW]: 'text-warning-light bg-warning-soft border-warning/40',
  [TASK_STATUS.REVISION_REQUIRED]: 'text-danger-light bg-danger-soft border-danger/40',
  [TASK_STATUS.COMPLETED]: 'text-success-light bg-success-soft border-success/40',
  [TASK_STATUS.BLOCKED]: 'text-danger-light bg-danger-soft border-danger/40',
  [TASK_STATUS.CANCELLED]: 'text-text-muted bg-bg-hover border-border line-through',
};

// ----- Task priority
export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

export const TASK_PRIORITY_LIST = [
  TASK_PRIORITY.LOW,
  TASK_PRIORITY.MEDIUM,
  TASK_PRIORITY.HIGH,
  TASK_PRIORITY.URGENT,
];

export const TASK_PRIORITY_LABELS = {
  [TASK_PRIORITY.LOW]: 'Low',
  [TASK_PRIORITY.MEDIUM]: 'Medium',
  [TASK_PRIORITY.HIGH]: 'High',
  [TASK_PRIORITY.URGENT]: 'Urgent',
};

export const TASK_PRIORITY_STYLES = {
  [TASK_PRIORITY.LOW]: 'text-text-secondary bg-bg-hover border-border',
  [TASK_PRIORITY.MEDIUM]: 'text-info-light bg-info-soft border-info/40',
  [TASK_PRIORITY.HIGH]: 'text-warning-light bg-warning-soft border-warning/40',
  [TASK_PRIORITY.URGENT]: 'text-danger-light bg-danger-soft border-danger/40',
};

// ----- Review statuses
export const REVIEW_STATUS = {
  SUBMITTED: 'SUBMITTED',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REVISION_REQUIRED: 'REVISION_REQUIRED',
  RESUBMITTED: 'RESUBMITTED',
};

export const REVIEW_STATUS_LABELS = {
  [REVIEW_STATUS.SUBMITTED]: 'Submitted',
  [REVIEW_STATUS.IN_REVIEW]: 'In Review',
  [REVIEW_STATUS.APPROVED]: 'Approved',
  [REVIEW_STATUS.REVISION_REQUIRED]: 'Revision Required',
  [REVIEW_STATUS.RESUBMITTED]: 'Resubmitted',
};

export const REVIEW_STATUS_STYLES = {
  [REVIEW_STATUS.SUBMITTED]: 'text-info-light bg-info-soft border-info/40',
  [REVIEW_STATUS.IN_REVIEW]: 'text-warning-light bg-warning-soft border-warning/40',
  [REVIEW_STATUS.APPROVED]: 'text-success-light bg-success-soft border-success/40',
  [REVIEW_STATUS.REVISION_REQUIRED]: 'text-danger-light bg-danger-soft border-danger/40',
  [REVIEW_STATUS.RESUBMITTED]: 'text-primary-300 bg-primary-500/10 border-primary-500/40',
};

// ----- Project statuses
export const PROJECT_STATUS = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
};

export const PROJECT_STATUS_LIST = [
  PROJECT_STATUS.PLANNING,
  PROJECT_STATUS.ACTIVE,
  PROJECT_STATUS.ON_HOLD,
  PROJECT_STATUS.COMPLETED,
  PROJECT_STATUS.ARCHIVED,
];

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.PLANNING]: 'Planning',
  [PROJECT_STATUS.ACTIVE]: 'Active',
  [PROJECT_STATUS.ON_HOLD]: 'On Hold',
  [PROJECT_STATUS.COMPLETED]: 'Completed',
  [PROJECT_STATUS.ARCHIVED]: 'Archived',
};

export const PROJECT_STATUS_STYLES = {
  [PROJECT_STATUS.PLANNING]: 'text-info-light bg-info-soft border-info/40',
  [PROJECT_STATUS.ACTIVE]: 'text-success-light bg-success-soft border-success/40',
  [PROJECT_STATUS.ON_HOLD]: 'text-warning-light bg-warning-soft border-warning/40',
  [PROJECT_STATUS.COMPLETED]: 'text-text-secondary bg-bg-hover border-border',
  [PROJECT_STATUS.ARCHIVED]: 'text-text-muted bg-bg-hover border-border',
};

// ----- Roles
export const ROLE = {
  ADMIN: 'ADMIN',
  TEAM_LEAD: 'TEAM_LEAD',
  DEVELOPER: 'DEVELOPER',
};

export const ROLE_LABELS = {
  [ROLE.ADMIN]: 'Admin',
  [ROLE.TEAM_LEAD]: 'Team Lead',
  [ROLE.DEVELOPER]: 'Developer',
};

export const ROLE_STYLES = {
  [ROLE.ADMIN]: 'text-danger-light bg-danger-soft border-danger/40',
  [ROLE.TEAM_LEAD]: 'text-warning-light bg-warning-soft border-warning/40',
  [ROLE.DEVELOPER]: 'text-info-light bg-info-soft border-info/40',
};

// ----- User statuses
export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
};

export const USER_STATUS_LABELS = {
  [USER_STATUS.ACTIVE]: 'Active',
  [USER_STATUS.INACTIVE]: 'Inactive',
  [USER_STATUS.SUSPENDED]: 'Suspended',
};

export const USER_STATUS_STYLES = {
  [USER_STATUS.ACTIVE]: 'text-success-light bg-success-soft border-success/40',
  [USER_STATUS.INACTIVE]: 'text-text-muted bg-bg-hover border-border',
  [USER_STATUS.SUSPENDED]: 'text-danger-light bg-danger-soft border-danger/40',
};

// ----- Notification types
export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_REASSIGNED: 'TASK_REASSIGNED',
  REVIEW_REQUESTED: 'REVIEW_REQUESTED',
  REVIEW_APPROVED: 'REVIEW_APPROVED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  DEADLINE_APPROACHING: 'DEADLINE_APPROACHING',
  TASK_OVERDUE: 'TASK_OVERDUE',
  COMMENT_ADDED: 'COMMENT_ADDED',
  PROJECT_ASSIGNED: 'PROJECT_ASSIGNED',
  MENTION: 'MENTION',
};

export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPE.TASK_ASSIGNED]: 'Task Assigned',
  [NOTIFICATION_TYPE.TASK_REASSIGNED]: 'Task Reassigned',
  [NOTIFICATION_TYPE.REVIEW_REQUESTED]: 'Review Requested',
  [NOTIFICATION_TYPE.REVIEW_APPROVED]: 'Review Approved',
  [NOTIFICATION_TYPE.REVISION_REQUESTED]: 'Revision Required',
  [NOTIFICATION_TYPE.DEADLINE_APPROACHING]: 'Deadline Approaching',
  [NOTIFICATION_TYPE.TASK_OVERDUE]: 'Task Overdue',
  [NOTIFICATION_TYPE.COMMENT_ADDED]: 'New Comment',
  [NOTIFICATION_TYPE.PROJECT_ASSIGNED]: 'Project Assigned',
  [NOTIFICATION_TYPE.MENTION]: 'Mention',
};

export const NOTIFICATION_TYPE_ICONS = {
  [NOTIFICATION_TYPE.TASK_ASSIGNED]: 'checkSquare',
  [NOTIFICATION_TYPE.TASK_REASSIGNED]: 'refresh',
  [NOTIFICATION_TYPE.REVIEW_REQUESTED]: 'review',
  [NOTIFICATION_TYPE.REVIEW_APPROVED]: 'check',
  [NOTIFICATION_TYPE.REVISION_REQUESTED]: 'edit',
  [NOTIFICATION_TYPE.DEADLINE_APPROACHING]: 'clock',
  [NOTIFICATION_TYPE.TASK_OVERDUE]: 'flag',
  [NOTIFICATION_TYPE.COMMENT_ADDED]: 'message',
  [NOTIFICATION_TYPE.PROJECT_ASSIGNED]: 'folder',
  [NOTIFICATION_TYPE.MENTION]: 'star',
};

// ----- Activity action types
export const ACTIVITY_ACTION = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_UPDATED: 'PROJECT_UPDATED',
  PROJECT_ARCHIVED: 'PROJECT_ARCHIVED',
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_DELETED: 'TASK_DELETED',
  TASK_SUBMITTED: 'TASK_SUBMITTED',
  TASK_APPROVED: 'TASK_APPROVED',
  TASK_REVISION_REQUESTED: 'TASK_REVISION_REQUESTED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  FILE_UPLOADED: 'FILE_UPLOADED',
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
};

// ----- Sort directions
export const SORT_DIR = {
  ASC: 'asc',
  DESC: 'desc',
};

// ----- Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ----- API
export const API_BASE_URL = import.meta.env?.VITE_API_URL || '/api';
export const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

// ----- App metadata
export const APP_NAME = 'PCT';
export const APP_FULL_NAME = 'Permetheon Command Terminal';
export const APP_DOMAIN = 'pct.permetheon.com';