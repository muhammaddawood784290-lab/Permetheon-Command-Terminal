// =====================================================================
// ActivityItem — a single row in the activity timeline.
//
// Layout mirrors the notification item so the two surfaces feel
// related: actor avatar on the left, an action icon in a tinted
// badge, then the summary line and the metadata diff. The whole row
// is a button when the target is navigable, while keyboard activation
// stays inside the row to avoid the "click eats the dropdown" trap.
//
// Activity is read-only, so this component owns no actions of its own.
// The parent passes a clickable handler that resolves the URL via
// resolveTargetPath() and pushes the router.
// =====================================================================

import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import { cn } from '../../utils/cn';
import { formatRelativeTime, formatTime } from '../../utils/formatDate';
import {
  ACTIVITY_ACTION_CATEGORY_MAP,
  ACTIVITY_ACTION_CATEGORY_LABELS,
  ACTIVITY_ACTION_ICONS,
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_TARGET_LABELS,
} from '../../utils/constants';
import ActivityChangeDetails from './ActivityChangeDetails';

/**
 * Map a target type + id back to a route. Activity entries can land
 * on a task, a project, a user, or just the activity page itself when
 * the target isn't actionable (auth events, system events).
 */
export function resolveActivityPath(entry) {
  if (!entry) return null;
  const { targetType, targetId } = entry;
  if (!targetType || !targetId) return null;
  switch (targetType) {
    case 'task':
      return `/tasks/${targetId}`;
    case 'project':
      return `/projects/${targetId}`;
    case 'user':
      return `/users/${targetId}`;
    case 'comment':
    case 'file':
    case 'review':
      // These never open standalone; fall back to the parent task/project.
      return entry.projectId ? `/projects/${entry.projectId}` : null;
    case 'notification':
      return '/notifications';
    default:
      return null;
  }
}

const CATEGORY_TONE = {
  AUTH: 'bg-info-soft text-info-light',
  USER: 'bg-primary-500/10 text-primary-300',
  PROJECT: 'bg-success-soft text-success-light',
  TASK: 'bg-primary-500/10 text-primary-300',
  COMMENT: 'bg-info-soft text-info-light',
  REVIEW: 'bg-warning-soft text-warning-light',
  FILE: 'bg-info-soft text-info-light',
  NOTIFICATION: 'bg-bg-elevated text-text-secondary',
  SYSTEM: 'bg-danger-soft text-danger-light',
};

function ActionBadge({ entry }) {
  const category = ACTIVITY_ACTION_CATEGORY_MAP[entry.action] || 'SYSTEM';
  const icon = ACTIVITY_ACTION_ICONS[entry.action] || 'activity';
  const tone = CATEGORY_TONE[category] || CATEGORY_TONE.SYSTEM;
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md shrink-0',
        tone,
      )}
      aria-label={ACTIVITY_ACTION_CATEGORY_LABELS[category] || category}
    >
      <Icon name={icon} size="md" />
    </span>
  );
}

export default function ActivityItem({ entry, className, showProject = true }) {
  const navigate = useNavigate();
  const targetPath = resolveActivityPath(entry);
  const actionLabel = ACTIVITY_ACTION_LABELS[entry.action] || entry.action;
  const targetLabel = entry.targetLabel || entry.targetId;
  const targetType = entry.targetType
    ? ACTIVITY_TARGET_LABELS[entry.targetType]
    : null;

  const handleActivate = () => {
    if (targetPath) navigate(targetPath);
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
        targetPath && 'hover:bg-bg-hover cursor-pointer transition-colors',
        className,
      )}
    >
      {targetPath && (
        <button
          type="button"
          onClick={handleActivate}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 z-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface rounded"
          aria-label={`Open ${targetLabel}`}
        />
      )}

      <div className="relative z-10 flex items-start gap-3 w-full">
        <Avatar name={entry.actorName} size="sm" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xs uppercase tracking-wide text-text-muted">
              {actionLabel}
            </span>
            {targetType && (
              <span className="text-2xs text-text-muted/80">
                · {targetType}
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-text mt-0.5">
            {entry.summary}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
            <span className="font-medium text-text-secondary">{entry.actorName}</span>
            <span className="text-text-muted/60">·</span>
            <span title={entry.createdAt}>
              {formatRelativeTime(entry.createdAt)}
            </span>
            <span className="text-text-muted/60">·</span>
            <span className="font-mono">{formatTime(entry.createdAt)}</span>
            {targetPath && (
              <>
                <span className="text-text-muted/60">·</span>
                <span className="text-primary-400 inline-flex items-center gap-1">
                  Open
                  <Icon name="chevronRight" size="xs" />
                </span>
              </>
            )}
          </div>

          <div className="mt-2">
            <ActivityChangeDetails entry={entry} />
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          <ActionBadge entry={entry} />
        </div>
      </div>
    </div>
  );
}