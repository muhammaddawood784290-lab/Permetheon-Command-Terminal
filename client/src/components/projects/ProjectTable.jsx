// =====================================================================
// ProjectTable — desktop tabular view of projects.
// Rendered side-by-side with ProjectCard; the parent chooses which to
// show via the viewport.
//
// Actions menu is permission-aware: Developers only see the "View"
// action, while Admin/Team Lead see Edit, Archive, and Delete where
// their permission set allows it.
// =====================================================================

import { Link, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Table, THead, TBody, TR, TH, TD, TEmpty } from '../ui/Table';
import { ProjectStatusBadge } from '../ui/StatusBadge';
import Avatar, { AvatarStack } from '../ui/Avatar';
import ProgressBar from '../ui/ProgressBar';
import Icon from '../ui/Icon';
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { findUserById } from '../../mock/mockData';
import { formatDate, formatDateLong, getDaysUntil } from '../../utils/formatDate';
import { hasPermission } from '../../utils/permissions';

function resolveMembers(project, users) {
  return (project.memberIds || [])
    .map((id) => users.find((u) => u.id === id) || findUserById(id))
    .filter(Boolean);
}

function ProgressCell({ project }) {
  const overdue =
    project.status !== 'COMPLETED' &&
    project.status !== 'ARCHIVED' &&
    project.deadline &&
    getDaysUntil(project.deadline) < 0;
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
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
        className="flex-1"
      />
      <span className="text-xs text-text-muted w-9 text-right">{project.progress ?? 0}%</span>
    </div>
  );
}

function OwnerCell({ project, users }) {
  const owner = users.find((u) => u.id === project.ownerId) || findUserById(project.ownerId);
  const lead = users.find((u) => u.id === project.leadId) || findUserById(project.leadId);
  if (!owner && !lead) {
    return <span className="text-text-muted text-xs">Unassigned</span>;
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      {owner && <Avatar name={owner.name} color={owner.avatarColor} size="sm" />}
      <div className="min-w-0">
        <div className="text-xs text-text truncate">{owner?.name || '—'}</div>
        {lead && lead.id !== owner?.id && (
          <div className="text-[11px] text-text-muted truncate">Lead · {lead.name}</div>
        )}
      </div>
    </div>
  );
}

function DeadlineCell({ project }) {
  if (!project.deadline) {
    return <span className="text-text-muted text-xs">—</span>;
  }
  const overdue =
    project.status !== 'COMPLETED' &&
    project.status !== 'ARCHIVED' &&
    getDaysUntil(project.deadline) < 0;
  return (
    <span
      className={`text-xs whitespace-nowrap ${overdue ? 'text-danger-light' : 'text-text-secondary'}`}
      title={formatDateLong(project.deadline)}
    >
      {formatDate(project.deadline)}
    </span>
  );
}

function ActionsCell({ project, user, onEdit, onArchive, onDelete, onChangeStatus }) {
  const navigate = useNavigate();
  const trigger = (
    <button
      type="button"
      aria-label={`Open actions for ${project.name}`}
      className="inline-flex items-center justify-center h-7 w-7 rounded-md text-text-muted hover:text-text hover:bg-bg-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
    >
      <Icon name="more" size="sm" />
    </button>
  );

  return (
    <Dropdown trigger={trigger} align="right">
      <DropdownItem
        leftIcon={<Icon name="folder" size="sm" />}
        onClick={() => navigate(`/projects/${project.id}`)}
      >
        View details
      </DropdownItem>
      {hasPermission(user, 'project.update') && (
        <DropdownItem leftIcon={<Icon name="edit" size="sm" />} onClick={() => onEdit?.(project)}>
          Edit project
        </DropdownItem>
      )}
      {hasPermission(user, 'project.update') && (
        <DropdownItem
          leftIcon={<Icon name="refresh" size="sm" />}
          onClick={() => onChangeStatus?.(project)}
        >
          Change status
        </DropdownItem>
      )}
      {hasPermission(user, 'project.archive') && project.status !== 'ARCHIVED' && (
        <DropdownItem leftIcon={<Icon name="archive" size="sm" />} onClick={() => onArchive?.(project)}>
          Archive
        </DropdownItem>
      )}
      {hasPermission(user, 'project.delete') && (
        <>
          <DropdownSeparator />
          <DropdownItem
            leftIcon={<Icon name="trash" size="sm" />}
            onClick={() => onDelete?.(project)}
            danger
          >
            Delete
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}

export default function ProjectTable({
  projects,
  users = [],
  user,
  loading = false,
  onEdit,
  onArchive,
  onDelete,
  onChangeStatus,
}) {
  const rows = useMemo(() => projects || [], [projects]);

  return (
    <div className="bg-bg-surface border border-border rounded-md overflow-hidden">
      <Table>
        <THead>
          <TR>
            <TH className="w-[28%]">Project</TH>
            <TH>Status</TH>
            <TH>Owner</TH>
            <TH>Team</TH>
            <TH>Progress</TH>
            <TH>Deadline</TH>
            <TH align="right" className="w-[60px]">
              <span className="sr-only">Actions</span>
            </TH>
          </TR>
        </THead>
        <TBody>
          {loading ? (
            <TEmpty colSpan={7}>
              <div className="flex items-center justify-center gap-2 text-text-muted">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
                Loading projects...
              </div>
            </TEmpty>
          ) : rows.length === 0 ? (
            <TEmpty colSpan={7}>No projects match the current filters.</TEmpty>
          ) : (
            rows.map((project) => {
              const members = resolveMembers(project, users);
              return (
                <TR key={project.id}>
                  <TD>
                    <Link
                      to={`/projects/${project.id}`}
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
                    >
                      <div className="text-xs text-text-muted">{project.code}</div>
                      <div className="text-sm text-text font-medium truncate">{project.name}</div>
                      {project.description && (
                        <div className="text-xs text-text-muted truncate max-w-[28rem] mt-0.5">
                          {project.description}
                        </div>
                      )}
                      {project.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {project.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded bg-bg-hover text-text-secondary border border-border"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </TD>
                  <TD>
                    <ProjectStatusBadge status={project.status} size="sm" />
                  </TD>
                  <TD>
                    <OwnerCell project={project} users={users} />
                  </TD>
                  <TD>
                    {members.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <AvatarStack users={members} max={3} size="sm" />
                        <span className="text-xs text-text-muted">{members.length}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">No members</span>
                    )}
                  </TD>
                  <TD>
                    <ProgressCell project={project} />
                  </TD>
                  <TD>
                    <DeadlineCell project={project} />
                  </TD>
                  <TD align="right">
                    <ActionsCell
                      project={project}
                      user={user}
                      onEdit={onEdit}
                      onArchive={onArchive}
                      onDelete={onDelete}
                      onChangeStatus={onChangeStatus}
                    />
                  </TD>
                </TR>
              );
            })
          )}
        </TBody>
      </Table>
    </div>
  );
}