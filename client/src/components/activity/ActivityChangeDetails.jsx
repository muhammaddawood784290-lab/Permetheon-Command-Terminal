// =====================================================================
// ActivityChangeDetails — renders the structured diff for a single
// activity entry. Different actions emit different shapes, so we
// switch on (action, metadata) and return a context-specific line.
//
// The component is intentionally narrow: it shows ONE thing well
// (the change that happened) rather than re-implementing the timeline
// item. The parent wraps it in a card or a collapsible section.
// =====================================================================

import Icon from '../ui/Icon';
import {
  ACTIVITY_ACTION,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  ROLE_LABELS,
  PROJECT_STATUS_LABELS,
} from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';

function Pill({ tone = 'default', children }) {
  const toneClasses = {
    default: 'bg-bg-elevated text-text-secondary',
    removed: 'bg-danger-soft text-danger-light',
    added: 'bg-success-soft text-success-light',
    info: 'bg-info-soft text-info-light',
    warning: 'bg-warning-soft text-warning-light',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-medium border border-border-subtle ${toneClasses[tone] || toneClasses.default}`}
    >
      {children}
    </span>
  );
}

function StatusChange({ from, to }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Pill tone="removed">{TASK_STATUS_LABELS[from] || from || '—'}</Pill>
      <Icon name="arrowRight" size="sm" className="text-text-muted" />
      <Pill tone="added">{TASK_STATUS_LABELS[to] || to || '—'}</Pill>
    </div>
  );
}

function PriorityChange({ from, to }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Pill tone="removed">{TASK_PRIORITY_LABELS[from] || from || '—'}</Pill>
      <Icon name="arrowRight" size="sm" className="text-text-muted" />
      <Pill tone={to === 'URGENT' ? 'warning' : 'added'}>
        {TASK_PRIORITY_LABELS[to] || to || '—'}
      </Pill>
    </div>
  );
}

function RoleChange({ from, to }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Pill tone="removed">{ROLE_LABELS[from] || from || '—'}</Pill>
      <Icon name="arrowRight" size="sm" className="text-text-muted" />
      <Pill tone="added">{ROLE_LABELS[to] || to || '—'}</Pill>
    </div>
  );
}

function DeadlineChange({ from, to }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Pill tone="removed">{from ? formatDate(from) : '—'}</Pill>
      <Icon name="arrowRight" size="sm" className="text-text-muted" />
      <Pill tone="added">{to ? formatDate(to) : '—'}</Pill>
    </div>
  );
}

function AssigneeChange({ from, to }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Pill tone="removed">{from?.fromName || from?.from || '—'}</Pill>
      <Icon name="arrowRight" size="sm" className="text-text-muted" />
      <Pill tone="added">{to?.toName || to?.to || '—'}</Pill>
    </div>
  );
}

function KeyValueList({ items }) {
  return (
    <ul className="text-xs text-text-secondary space-y-1">
      {items.map(({ label, value }) => (
        <li key={label} className="flex items-center gap-2">
          <span className="text-text-muted">{label}:</span>
          <span className="text-text">{value}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Returns null when there is nothing meaningful to render — most plain
 * entries (task created, project updated, comment added) need nothing
 * besides the summary text already shown in the timeline row.
 */
export default function ActivityChangeDetails({ entry }) {
  if (!entry || !entry.metadata) return null;
  const { action, metadata } = entry;

  switch (action) {
    case ACTIVITY_ACTION.TASK_STATUS_CHANGED:
      return metadata.from || metadata.to ? (
        <StatusChange from={metadata.from} to={metadata.to} />
      ) : null;

    case ACTIVITY_ACTION.TASK_PRIORITY_CHANGED:
      return metadata.from || metadata.to ? (
        <PriorityChange from={metadata.from} to={metadata.to} />
      ) : null;

    case ACTIVITY_ACTION.TASK_DEADLINE_CHANGED:
      return metadata.from || metadata.to ? (
        <DeadlineChange from={metadata.from} to={metadata.to} />
      ) : null;

    case ACTIVITY_ACTION.TASK_REASSIGNED:
      if (metadata.fromName || metadata.toName) {
        return <AssigneeChange from={{ fromName: metadata.fromName }} to={{ toName: metadata.toName }} />;
      }
      return null;

    case ACTIVITY_ACTION.USER_ROLE_CHANGED:
      return metadata.from || metadata.to ? (
        <RoleChange from={metadata.from} to={metadata.to} />
      ) : null;

    case ACTIVITY_ACTION.TASK_ASSIGNED:
      return metadata.assigneeName ? (
        <Pill tone="info">
          <Icon name="users" size="xs" />
          {metadata.assigneeName}
        </Pill>
      ) : null;

    case ACTIVITY_ACTION.PROJECT_MEMBER_ADDED:
    case ACTIVITY_ACTION.PROJECT_MEMBER_REMOVED:
      return metadata.memberName ? (
        <Pill tone={action === ACTIVITY_ACTION.PROJECT_MEMBER_ADDED ? 'added' : 'removed'}>
          <Icon name="users" size="xs" />
          {metadata.memberName}
        </Pill>
      ) : null;

    case ACTIVITY_ACTION.PERMISSION_CHANGED:
      return metadata.permission ? (
        <KeyValueList
          items={[
            { label: 'Permission', value: metadata.permission },
            { label: 'Action', value: metadata.granted ? 'Granted' : 'Revoked' },
          ]}
        />
      ) : null;

    case ACTIVITY_ACTION.TASK_REVISION_REQUESTED:
      return metadata.reason ? (
        <p className="text-xs text-text-secondary italic">"{metadata.reason}"</p>
      ) : null;

    case ACTIVITY_ACTION.PROJECT_UPDATED:
      if (metadata.status) {
        return (
          <Pill tone={metadata.status === PROJECT_STATUS_LABELS.ARCHIVED ? 'warning' : 'info'}>
            {metadata.status}
          </Pill>
        );
      }
      return null;

    default:
      return null;
  }
}