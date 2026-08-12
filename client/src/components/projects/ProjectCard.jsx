// =====================================================================
// ProjectCard — compact card representation of a project for mobile/grid.
//
// Used as the mobile fallback when the table can't render at the
// current viewport width. Mirrors the table's row data 1:1 so swapping
// between views never changes what the user sees.
// =====================================================================

import { Link } from 'react-router-dom';
import { ProjectStatusBadge } from '../ui/StatusBadge';
import ProgressBar from '../ui/ProgressBar';
import Avatar, { AvatarStack } from '../ui/Avatar';
import Icon from '../ui/Icon';
import { findUserById } from '../../mock/mockData';
import { formatDate, formatRelativeTime, getDaysUntil } from '../../utils/formatDate';

function StatusIndicator({ project }) {
  const overdue =
    project.status !== 'COMPLETED' &&
    project.status !== 'ARCHIVED' &&
    project.deadline &&
    getDaysUntil(project.deadline) < 0;

  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1 text-2xs uppercase tracking-wide text-danger-light">
        <Icon name="flag" size="sm" />
        Overdue
      </span>
    );
  }
  return null;
}

function ProjectCard({ project, owner, lead, members = [] }) {
  const deadline = project.deadline ? new Date(project.deadline) : null;
  const daysLeft = project.deadline ? getDaysUntil(project.deadline) : null;
  const overdue =
    project.status !== 'COMPLETED' &&
    project.status !== 'ARCHIVED' &&
    daysLeft !== null &&
    daysLeft < 0;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-bg-surface border border-border rounded-md hover:border-border-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-text-muted">{project.code}</div>
            <div className="text-sm font-semibold text-text truncate">{project.name}</div>
          </div>
          <ProjectStatusBadge status={project.status} size="sm" />
        </div>

        {project.description && (
          <p className="text-xs text-text-muted line-clamp-2">{project.description}</p>
        )}

        <div>
          <div className="flex items-center justify-between text-2xs uppercase tracking-wide text-text-muted mb-1.5">
            <span>Progress</span>
            <span className="text-text-secondary">{project.progress ?? 0}%</span>
          </div>
          <ProgressBar
            value={project.progress ?? 0}
            tone={
              overdue
                ? 'danger'
                : project.status === 'COMPLETED'
                  ? 'success'
                  : project.status === 'ON_HOLD'
                    ? 'warning'
                    : 'primary'
            }
            size="sm"
          />
        </div>

        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {members.length > 0 && (
              <AvatarStack users={members.map((m) => ({ ...m, name: m.name || '?' }))} max={3} size="sm" />
            )}
            <span className="text-text-muted truncate">
              {owner ? `Owner · ${owner.name}` : 'Unassigned'}
            </span>
          </div>
          <div className="text-right shrink-0">
            {project.deadline && (
              <div className={overdue ? 'text-danger-light' : 'text-text-secondary'}>
                {formatDate(project.deadline)}
              </div>
            )}
            <StatusIndicator project={project} />
            {!overdue && project.deadline && (
              <div className="text-2xs text-text-muted">{formatRelativeTime(project.deadline)}</div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function resolveProjectRelations(project, users) {
  const owner = users.find((u) => u.id === project.ownerId) || findUserById(project.ownerId);
  const lead = users.find((u) => u.id === project.leadId) || findUserById(project.leadId);
  const members = (project.memberIds || [])
    .map((id) => users.find((u) => u.id === id) || findUserById(id))
    .filter(Boolean);
  return { owner, lead, members };
}

export default ProjectCard;