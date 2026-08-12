// =====================================================================
// ProjectsListPage — /projects
// Full project list with search, filters, sort, create flow, and
// permission-aware actions. Uses the service layer exclusively so the
// mock data swap in Phase 2 only touches projectService.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import PageContainer from '../../layouts/PageContainer';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

import ProjectStats from '../../components/projects/ProjectStats';
import ProjectFilters from '../../components/projects/ProjectFilters';
import ProjectTable from '../../components/projects/ProjectTable';
import ProjectCard from '../../components/projects/ProjectCard';
import ProjectForm from '../../components/projects/ProjectForm';

import projectService from '../../services/projectService';
import developerService from '../../services/developerService';
import { mockUsers } from '../../mock/mockData';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import { PROJECT_STATUS, PROJECT_STATUS_LABELS, SORT_DIR, ROLE } from '../../utils/constants';

const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  ownerId: 'all',
  sort: 'updatedAt',
  order: SORT_DIR.DESC,
  page: 1,
  limit: 50,
};

export default function ProjectsListPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // ----- filters / search (URL-aware where possible) ----------------
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [status, setStatus] = useState(() => searchParams.get('status') || 'all');
  const [ownerId, setOwnerId] = useState('all');
  const [sort, setSort] = useState('updatedAt');
  const [order, setOrder] = useState(SORT_DIR.DESC);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync status to the URL so deep-links and stats cards can drive it.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (status && status !== 'all') next.set('status', status);
    else next.delete('status');
    // Only push to the URL when something actually changed.
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Mirror external URL changes (e.g. clicking a stats card while already
  // on the page) back into our local state.
  useEffect(() => {
    const urlStatus = searchParams.get('status') || 'all';
    setStatus((prev) => (prev === urlStatus ? prev : urlStatus));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status,
      sort,
      order,
      page: 1,
      limit: 50,
    }),
    [debouncedSearch, status, sort, order],
  );

  const { data, loading, error, refetch } = useAsync(
    () => projectService.list(filters),
    [JSON.stringify(filters), refreshKey],
  );

  const items = data?.data?.items || [];
  const totalCount = data?.data?.total || 0;

  // ----- owner / lead picker data -----------------------------------
  const { data: devData } = useAsync(() => developerService.list(), []);
  const owners = useMemo(() => {
    const set = new Map();
    mockUsers.forEach((u) => {
      if (u.role === ROLE.ADMIN || u.role === ROLE.TEAM_LEAD) {
        set.set(u.id, { id: u.id, name: u.name, role: u.role });
      }
    });
    (devData?.data?.items || []).forEach((u) =>
      set.set(u.userId || u.id, { id: u.userId || u.id, name: u.name, role: u.role }),
    );
    return Array.from(set.values());
  }, [devData]);
  const ownerOptions = useMemo(() => owners.map((o) => ({ id: o.id, name: o.name })), [owners]);

  // ----- filtering locally by ownerId (service doesn't yet) ---------
  const visibleProjects = useMemo(() => {
    if (ownerId === 'all') return items;
    return items.filter((p) => p.ownerId === ownerId);
  }, [items, ownerId]);

  // ----- create / edit flow -----------------------------------------
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = hasPermission(user, 'project.create');
  const canEdit = hasPermission(user, 'project.update');
  const canArchive = hasPermission(user, 'project.archive');
  const canDelete = hasPermission(user, 'project.delete');

  const openCreate = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const openEdit = (project) => {
    if (!canEdit) {
      push({ type: 'warning', message: 'You do not have permission to edit projects.' });
      return;
    }
    setEditingProject(project);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingProject(null);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingProject) {
        const res = await projectService.update(editingProject.id, {
          ...values,
          startDate: values.startDate
            ? new Date(values.startDate).toISOString()
            : editingProject.startDate,
          deadline: values.deadline
            ? new Date(values.deadline).toISOString()
            : editingProject.deadline,
        });
        if (!res?.success) throw new Error(res?.message || 'Update failed');
        push({ type: 'success', message: `Project "${values.name}" updated.` });
      } else {
        const res = await projectService.create({
          ...values,
          ownerId: values.ownerId || user?.id,
          leadId: values.leadId || values.ownerId || user?.id,
          startDate: values.startDate ? new Date(values.startDate).toISOString() : new Date().toISOString(),
          deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
        });
        if (!res?.success) throw new Error(res?.message || 'Create failed');
        push({ type: 'success', message: `Project "${values.name}" created.` });
      }
      closeForm();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      push({ type: 'error', message: err.message || 'Could not save the project.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ----- archive / delete confirm ----------------------------------
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const askArchive = (project) => {
    if (!canArchive) {
      push({ type: 'warning', message: 'You do not have permission to archive projects.' });
      return;
    }
    setConfirm({
      title: 'Archive project',
      message: `Archive "${project.name}"? It will be hidden from active work but kept for reporting.`,
      confirmLabel: 'Archive',
      variant: 'primary',
      action: async () => {
        setActionLoading(true);
        try {
          const res = await projectService.update(project.id, { status: PROJECT_STATUS.ARCHIVED });
          if (!res?.success) throw new Error(res?.message || 'Archive failed');
          push({ type: 'success', message: `Project "${project.name}" archived.` });
          setRefreshKey((k) => k + 1);
        } catch (err) {
          push({ type: 'error', message: err.message || 'Could not archive the project.' });
        } finally {
          setActionLoading(false);
          setConfirm(null);
        }
      },
    });
  };

  const askDelete = (project) => {
    if (!canDelete) {
      push({ type: 'warning', message: 'You do not have permission to delete projects.' });
      return;
    }
    setConfirm({
      title: 'Delete project',
      message: `Permanently delete "${project.name}"? This cannot be undone in this prototype.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          const res = await projectService.remove(project.id);
          if (!res?.success) throw new Error(res?.message || 'Delete failed');
          push({ type: 'success', message: `Project "${project.name}" deleted.` });
          setRefreshKey((k) => k + 1);
        } catch (err) {
          push({ type: 'error', message: err.message || 'Could not delete the project.' });
        } finally {
          setActionLoading(false);
          setConfirm(null);
        }
      },
    });
  };

  const askChangeStatus = (project) => {
    if (!canEdit) {
      push({ type: 'warning', message: 'You do not have permission to change project status.' });
      return;
    }
    const order2 = [
      PROJECT_STATUS.PLANNING,
      PROJECT_STATUS.ACTIVE,
      PROJECT_STATUS.ON_HOLD,
      PROJECT_STATUS.COMPLETED,
      PROJECT_STATUS.ARCHIVED,
    ];
    const idx = order2.indexOf(project.status);
    const next = order2[(idx + 1) % order2.length];
    setConfirm({
      title: 'Change project status',
      message: `Move "${project.name}" from ${PROJECT_STATUS_LABELS[project.status]} to ${PROJECT_STATUS_LABELS[next]}?`,
      confirmLabel: 'Change status',
      variant: 'primary',
      action: async () => {
        setActionLoading(true);
        try {
          const res = await projectService.update(project.id, { status: next });
          if (!res?.success) throw new Error(res?.message || 'Update failed');
          push({ type: 'success', message: `Status set to ${PROJECT_STATUS_LABELS[next]}.` });
          setRefreshKey((k) => k + 1);
        } catch (err) {
          push({ type: 'error', message: err.message || 'Could not update status.' });
        } finally {
          setActionLoading(false);
          setConfirm(null);
        }
      },
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setStatus('all');
    setOwnerId('all');
  };

  const hasFilters =
    Boolean(searchInput) || (status && status !== 'all') || (ownerId && ownerId !== 'all');

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Icon name="refresh" size="sm" />}
        onClick={() => setRefreshKey((k) => k + 1)}
        aria-label="Refresh projects"
      >
        Refresh
      </Button>
      {canCreate && (
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Icon name="plus" size="sm" />}
          onClick={openCreate}
        >
          New project
        </Button>
      )}
    </div>
  );

  // Build a single flattened user list for table/card lookups.
  const allUsers = useMemo(() => {
    const list = [...mockUsers];
    (devData?.data?.items || []).forEach((u) => {
      if (!list.some((m) => m.id === (u.userId || u.id))) {
        list.push({ id: u.userId || u.id, name: u.name, avatarColor: u.avatarColor });
      }
    });
    return list;
  }, [devData]);

  return (
    <PageContainer
      title="Projects"
      subtitle="All Permetheon projects in one place. Track status, ownership, and progress."
      actions={headerActions}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Projects' },
      ]}
    >
      <ProjectStats refreshKey={refreshKey} />

      <Card padding="md">
        <CardBody>
          <ProjectFilters
            search={searchInput}
            onSearchChange={setSearchInput}
            status={status}
            onStatusChange={setStatus}
            ownerId={ownerId}
            onOwnerChange={setOwnerId}
            ownerOptions={ownerOptions}
            sort={sort}
            onSortChange={setSort}
            order={order}
            onOrderChange={setOrder}
            onReset={handleResetFilters}
            totalCount={totalCount}
            filteredCount={visibleProjects.length}
          />
        </CardBody>
      </Card>

      {/* Desktop table */}
      <div className="hidden md:block">
        {error ? (
          <ErrorState
            title="Could not load projects"
            description={error.message}
            onRetry={refetch}
          />
        ) : (
          <ProjectTable
            projects={visibleProjects}
            users={allUsers}
            user={user}
            loading={loading}
            onEdit={openEdit}
            onArchive={askArchive}
            onDelete={askDelete}
            onChangeStatus={askChangeStatus}
          />
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        {error ? (
          <ErrorState
            title="Could not load projects"
            description={error.message}
            onRetry={refetch}
          />
        ) : loading ? (
          <Card>
            <CardBody>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-md bg-bg-hover animate-pulse" />
                ))}
              </div>
            </CardBody>
          </Card>
        ) : visibleProjects.length === 0 ? (
          <EmptyState
            icon={<Icon name="folder" size="md" />}
            title={hasFilters ? 'No projects match these filters' : 'No projects yet'}
            description={
              hasFilters
                ? 'Try clearing the search or status filter.'
                : 'Create your first project to start tracking work.'
            }
            action={
              canCreate && !hasFilters ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Icon name="plus" size="sm" />}
                  onClick={openCreate}
                >
                  New project
                </Button>
              ) : hasFilters ? (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                owner={allUsers.find((u) => u.id === project.ownerId)}
                lead={allUsers.find((u) => u.id === project.leadId)}
                members={(project.memberIds || [])
                  .map((id) => allUsers.find((u) => u.id === id))
                  .filter(Boolean)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop empty state when no results but loaded successfully */}
      {!loading && !error && visibleProjects.length === 0 && (
        <div className="hidden md:block">
          <EmptyState
            icon={<Icon name="folder" size="md" />}
            title={hasFilters ? 'No projects match these filters' : 'No projects yet'}
            description={
              hasFilters
                ? 'Try clearing the search or status filter.'
                : 'Create your first project to start tracking work.'
            }
            action={
              canCreate && !hasFilters ? (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Icon name="plus" size="sm" />}
                  onClick={openCreate}
                >
                  New project
                </Button>
              ) : hasFilters ? (
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        </div>
      )}

      <ProjectForm
        open={formOpen}
        mode={editingProject ? 'edit' : 'create'}
        initialValues={editingProject}
        ownerOptions={ownerOptions}
        leadOptions={owners}
        defaultOwnerId={user?.id}
        onSubmit={handleSubmit}
        onClose={closeForm}
        submitting={submitting}
      />

      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          variant={confirm.variant}
          loading={actionLoading}
          onConfirm={confirm.action}
          onClose={() => !actionLoading && setConfirm(null)}
        />
      )}
    </PageContainer>
  );
}

export { DEFAULT_FILTERS };