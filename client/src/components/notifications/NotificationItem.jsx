// =====================================================================
// NotificationItem — single notification row used in the list and the
// Topbar bell dropdown. Renders the actor avatar, the type icon, the
// title and message, and a set of contextual actions (mark read /
// unread, open target, remove). All callbacks are pure props so the
// parent stays in control of state.
// =====================================================================

import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { cn } from '../../utils/cn';
import { formatRelativeTime } from '../../utils/formatDate';
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_ICONS,
} from '../../utils/constants';

/**
 * Resolve the URL a notification should navigate to when clicked. The
 * shape mirrors the entity_type / entity_id pattern documented in
 * NOTIFICATION_SYSTEM.md. Unknown types return null so callers can
 * decide whether to fall back to /notifications.
 */
export function resolveTargetPath(notification) {
  if (!notification || !notification.targetType) return null;
  const { targetType, targetId } = notification;
  if (!targetId) return null;
  switch (targetType) {
    case 'task':
      return `/tasks/${targetId}`;
    case 'project':
      return `/projects/${targetId}`;
    case 'review':
      return `/reviews/${targetId}`;
    case 'comment':
      // Comments live on tasks; fall back to the task url.
      return notification.taskId ? `/tasks/${notification.taskId}` : null;
    case 'file':
      return notification.taskId ? `/tasks/${notification.taskId}` : null;
    case 'system':
      return '/notifications';
    default:
      return null;
  }
}

const TYPE_TONE = {
  [NOTIFICATION_TYPE.REVIEW_REQUESTED]: 'bg-primary-500/10 text-primary-300',
  [NOTIFICATION_TYPE.REVIEW_APPROVED]: 'bg-success-soft text-success-light',
  [NOTIFICATION_TYPE.REVISION_REQUESTED]: 'bg-warning-soft text-warning-light',
  [NOTIFICATION_TYPE.TASK_ASSIGNED]: 'bg-info-soft text-info-light',
  [NOTIFICATION_TYPE.TASK_REASSIGNED]: 'bg-info-soft text-info-light',
  [NOTIFICATION_TYPE.TASK_OVERDUE]: 'bg-danger-soft text-danger-light',
  [NOTIFICATION_TYPE.DEADLINE_APPROACHING]: 'bg-warning-soft text-warning-light',
  [NOTIFICATION_TYPE.COMMENT_ADDED]: 'bg-info-soft text-info-light',
  [NOTIFICATION_TYPE.MENTION]: 'bg-primary-500/10 text-primary-300',
  [NOTIFICATION_TYPE.PROJECT_ASSIGNED]: 'bg-success-soft text-success-light',
};

function NotificationIcon({ type }) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md shrink-0',
        TYPE_TONE[type] || 'bg-bg-hover text-text-secondary',
      )}
    >
      <Icon name={NOTIFICATION_TYPE_ICONS[type] || 'bell'} size="md" />
    </span>
  );
}

function ActionsMenu({ notification, onMarkAsRead, onMarkAsUnread, onRemove }) {
  const trigger = (
    <button
      type="button"
      aria-label={`Open actions for notification ${notification.id}`}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-text-muted hover:text-text hover:bg-bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      <Icon name="more" size="sm" />
    </button>
  );

  return (
    <Dropdown trigger={trigger} align="right">
      {!notification.read && (
        <DropdownItem
          leftIcon={<Icon name="check" size="sm" />}
          onClick={() => onMarkAsRead?.(notification)}
        >
          Mark as read
        </DropdownItem>
      )}
      {notification.read && (
        <DropdownItem
          leftIcon={<Icon name="refresh" size="sm" />}
          onClick={() => onMarkAsUnread?.(notification)}
        >
          Mark as unread
        </DropdownItem>
      )}
      <DropdownSeparator />
      <DropdownItem
        leftIcon={<Icon name="trash" size="sm" />}
        onClick={() => onRemove?.(notification)}
        danger
      >
        Remove
      </DropdownItem>
    </Dropdown>
  );
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onRemove,
  showActions = true,
  className,
}) {
  const navigate = useNavigate();
  const targetPath = resolveTargetPath(notification);
  const typeLabel = NOTIFICATION_TYPE_LABELS[notification.type] || 'Notification';

  const handleActivate = () => {
    // Mark as read optimistically when the user opens the notification.
    if (!notification.read) {
      onMarkAsRead?.(notification);
    }
    if (targetPath) {
      navigate(targetPath);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 px-4 py-3 border-b border-border-subtle last:border-b-0',
        !notification.read && 'bg-primary-600/5',
        'hover:bg-bg-hover transition-colors',
        className,
      )}
    >
      <button
        type="button"
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        className="absolute inset-0 z-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface rounded"
        aria-label={`Open ${typeLabel}`}
      />

      <div className="relative z-10 flex items-start gap-3 w-full pointer-events-none">
        <NotificationIcon type={notification.type} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xs uppercase tracking-wide text-text-muted">
              {typeLabel}
            </span>
            {!notification.read && (
              <span className="text-2xs font-semibold text-primary-400">New</span>
            )}
          </div>
          <div className="text-sm font-medium text-text truncate mt-0.5">
            {notification.title}
          </div>
          {notification.message && (
            <div className="text-xs text-text-secondary mt-0.5 line-clamp-2">
              {notification.message}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
            {notification.actorId ? (
              <>
                <Avatar
                  name={notification.actorName}
                  size="xs"
                />
                <span className="truncate">{notification.actorName}</span>
                <span className="text-text-muted/60">·</span>
              </>
            ) : null}
            <span title={notification.createdAt}>
              {formatRelativeTime(notification.createdAt)}
            </span>
            {targetPath && (
              <>
                <span className="text-text-muted/60">·</span>
                <span className="text-primary-400 truncate">Open</span>
              </>
            )}
          </div>
        </div>

        {showActions && (
          <div className="relative z-10 pointer-events-auto shrink-0">
            <ActionsMenu
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onMarkAsUnread={onMarkAsUnread}
              onRemove={onRemove}
            />
          </div>
        )}
      </div>
    </div>
  );
}
