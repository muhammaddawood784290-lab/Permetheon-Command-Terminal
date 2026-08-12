// =====================================================================
// ProjectDetailPage — /projects/:projectId
//
// The Tasks / Reviews / Activity / Reports / Developers modules are
// out of scope for this pass, so this page renders a project header +
// placeholder tabs and an "Implementation coming soon" message. It
// serves as the destination of every link in the Projects list, and
// the breadcrumbs make the navigation intent clear.
//
// Once the sibling modules are built, each tab here will be replaced
// with the real implementation; the page shell itself should not need
// to change.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../../layouts/PageContainer';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import LoadingState from '../../components/ui/LoadingState';
import { ProjectStatusBadge } from '../../components/ui/StatusBadge';
import Avatar, { AvatarStack } from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import projectService from '../../services/projectService';
import { mockUsers, findUserById } from '../../mock/mockData';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { formatDate, formatDateLong, getDaysUntil } from '../../utils/formatDate';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'developers', label: 'Developers' },
  { key: 'activity', label: 'Activity' },
];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');

  const { data, loading, error, refetch } = useAsync(
    () => projectService.get(projectId),
    [projectId],
  );

  const project = data?.data;

  // Once the project loads, fall back to the list if the id is bogus.
  useEffect(() => {
    if (!loading && error && error.status === 404) {
      navigate('/projects', { replace: true });
    }
  }, [loading, error, navigate]);

  const members = useMemo(() => {
    if (!project) return [];
    return (project.memberIds || [])
      .map((id) => mockUsers.find((u) => u.id === id) || findUserById(id))
      .filter(Boolean);
  }, [project]);

  const owner = useMemo(() => {
    if (!project) return null;
    return mockUsers.find((u) => u.id === project.ownerId) || findUserById(project.ownerId);
  }, [project]);

  const lead = useMemo(() => {
    if (!project) return null;
    return mockUsers.find((u) => u.id === project.leadId) || findUserById(project.leadId);
  }, [project]);

  const canEdit = hasPermission(user, 'project.update');
  const canArchive = hasPermission(user, 'project.archive');
  const canDelete = hasPermission(user, 'project.delete');

  if (loading) {
    return (
      <PageContainer title="Loading project..." breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Projects', to: '/projects' }, { label: '...' }]}>
        <Card>
          <CardBody>
            <LoadingState rows={4} height="h-12" />
          </CardBody>
        </Card>
      </PageContainer>
    );
  }

  if (error || !project) {
    return (
      <PageContainer
        title="Project not found"
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Projects', to: '/projects' }]}
      >
        <ErrorState
          title="We could not load this project"
          description={error?.message || 'The project may have been deleted or moved.'}
          onRetry={refetch}
        />
        <div className="mt-3">
          <Link to="/projects">
            <Button variant="ghost" leftIcon={<Icon name="chevronLeft" size="sm" />}>
              Back to projects
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const overdue =
    project.status !== 'COMPLETED' &&
    project.status !== 'ARCHIVED' &&
    project.deadline &&
    getDaysUntil(project.deadline) < 0;

  return (
    <PageContainer
      title={project.name}
      subtitle={`${project.code} · ${project.description || 'No description yet.'}`}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Projects', to: '/projects' },
        { label: project.code },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Link to="/projects">
            <Button variant="ghost" size="sm" leftIcon={<Icon name="chevronLeft" size="sm" />}>
              Back
            </Button>
          </Link>
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Icon name="edit" size="sm" />}
              onClick={() => navigate('/projects')}
            >
              Edit
            </Button>
          )}
          {canArchive && project.status !== 'ARCHIVED' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Icon name="archive" size="sm" />}
              onClick={() => navigate('/projects')}
            >
              Archive
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Icon name="trash" size="sm" />}
              onClick={() => navigate('/projects')}
            >
              Delete
            </Button>
          )}
        </div>
      }
    >
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-2xs uppercase tracking-wide text-text-muted">Status</div>
              <div className="mt-1">
                <ProjectStatusBadge status={project.status} size="sm" />
              </div>
            </div>
            <div>
              <div className="text-2xs uppercase tracking-wide text-text-muted">Owner</div>
              <div className="mt-1 flex items-center gap-2">
                {owner ? (
                  <>
                    <Avatar name={owner.name} color={owner.avatarColor} size="sm" />
                    <div>
                      <div className="text-sm text-text">{owner.name}</div>
                      <div className="text-xs text-text-muted">{owner.title}</div>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-text-muted">Unassigned</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-2xs uppercase tracking-wide text-text-muted">Lead</div>
              <div className="mt-1 flex items-center gap-2">
                {lead ? (
                  <>
                    <Avatar name={lead.name} color={lead.avatarColor} size="sm" />
                    <div>
                      <div className="text-sm text-text">{lead.name}</div>
                      <div className="text-xs text-text-muted">{lead.title}</div>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-text-muted">Unassigned</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-2xs uppercase tracking-wide text-text-muted">Deadline</div>
              <div className="mt-1">
                <div className={`text-sm ${overdue ? 'text-danger-light' : 'text-text'}`}>
                  {project.deadline ? formatDateLong(project.deadline) : '—'}
                </div>
                {project.deadline && (
                  <div className={`text-xs ${overdue ? 'text-danger-light' : 'text-text-muted'}`}>
                    {overdue
                      ? `Overdue by ${Math.abs(getDaysUntil(project.deadline))} day(s)`
                      : `${getDaysUntil(project.deadline)} day(s) remaining`}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5">
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
            />
          </div>

          {project.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-bg-hover text-text-secondary border border-border"
                >
                  <Icon name="tag" size="sm" className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tab nav (placeholder). Real tab content lands in a future pass. */}
      <Card padding="md">
        <div role="tablist" aria-label="Project sections" className="flex items-center gap-2 border-b border-border mb-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px px-3 py-2 text-sm border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-primary-400 text-text'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card padding="md">
              <CardHeader>
                <CardTitle subtitle="Project members and ownership">Team</CardTitle>
              </CardHeader>
              <CardBody>
                {members.length === 0 ? (
                  <p className="text-sm text-text-muted">No team members assigned yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {members.map((m) => (
                      <li key={m.id} className="flex items-center gap-2">
                        <Avatar name={m.name} color={m.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm text-text truncate">{m.name}</div>
                          <div className="text-xs text-text-muted truncate">{m.title}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card padding="md">
              <CardHeader>
                <CardTitle subtitle="Lifecycle metadata">Details</CardTitle>
              </CardHeader>
              <CardBody>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                  <dt className="text-text-muted">Start date</dt>
                  <dd className="text-text">{project.startDate ? formatDate(project.startDate) : '—'}</dd>
                  <dt className="text-text-muted">Created</dt>
                  <dd className="text-text">{formatDate(project.createdAt)}</dd>
                  <dt className="text-text-muted">Last update</dt>
                  <dd className="text-text">{formatDate(project.updatedAt)}</dd>
                </dl>
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'tasks' && (
          <EmptyState
            icon={<Icon name="checkSquare" size="md" />}
            title="Tasks coming next"
            description="The Tasks module is being built in a follow-up pass. Tasks for this project will appear here once it's online."
            action={
              <Link to="/projects">
                <Button variant="ghost" size="sm" leftIcon={<Icon name="chevronLeft" size="sm" />}>
                  Back to projects
                </Button>
              </Link>
            }
          />
        )}

        {tab === 'developers' && (
          <div>
            {members.length === 0 ? (
              <EmptyState
                icon={<Icon name="users" size="md" />}
                title="No developers assigned yet"
              />
            ) : (
              <ul className="space-y-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 p-2 rounded-md bg-bg-subtle/40">
                    <Avatar name={m.name} color={m.avatarColor} size="sm" />
                    <div>
                      <div className="text-sm text-text">{m.name}</div>
                      <div className="text-xs text-text-muted">{m.title}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <EmptyState
            icon={<Icon name="activity" size="md" />}
            title="Activity coming next"
            description="The Activity module is being built in a follow-up pass."
          />
        )}
      </Card>

      {/* Avatar stack chip for the team, mirroring the table column. */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <AvatarStack users={members} max={5} size="sm" />
        <span>{members.length} team member(s)</span>
      </div>
    </PageContainer>
  );
}