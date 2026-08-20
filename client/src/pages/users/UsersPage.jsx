// =====================================================================
// UsersPage — /users
//
// Admin / team-lead workspace for managing users. Owns:
//   • Filter / search / sort / pagination state (URL-synced).
//   • User list rendering (table on desktop, cards on mobile).
//   • Stats KPIs loaded independently.
//   • Create / edit / role / status dialogs and their confirmations.
//   • Per-user activity panel.
//
// Self-protection and last-admin guards live in the service layer; the
// page mirrors those rules in the UI so the controls feel disabled
// before the request fails.
// =====================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import PageContainer from '../../layouts/PageContainer';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';

import UserStats from '../../components/users/UserStats';
import UserFilters from '../../components/users/UserFilters';
import UserTable from '../../components/users/UserTable';
import UserCard from '../../components/users/UserCard';
import UserForm from '../../components/users/UserForm';
import RoleChangeDialog from '../../components/users/RoleChangeDialog';
import StatusChangeDialog from '../../components/users/StatusChangeDialog';
import UserActivitySection, {
  loadActivityForUser,
} from '../../components/users/UserActivitySection';

import userService from '../../services/userService';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasPermission } from '../../utils/permissions';
import {
  DEFAULT_PAGE_SIZE,
  ROLE,
  SORT_DIR,
  USER_STATUS,
} from '../../utils/constants';

const DEFAULT_FILTERS = {
  search: '',
  role: 'all',
  status: 'all',
  sort: 'name',
  order: SORT_DIR.ASC,
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
};

function parseFilters(searchParams) {
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || DEFAULT_FILTERS.limit;
  return {
    search: searchParams.get('q') || '',
    role: searchParams.get('role') || 'all',
    status: searchParams.get('status') || 'all',
    sort: searchParams.get('sort') || DEFAULT_FILTERS.sort,
    order: searchParams.get('order') === SORT_DIR.DESC ? SORT_DIR.DESC : SORT_DIR.ASC,
    page,
    limit,
  };
}

function serializeFilters(filters) {
  const next = new URLSearchParams();
  if (filters.search) next.set('q', filters.search);
  if (filters.role && filters.role !== 'all') next.set('role', filters.role);
  if (filters.status && filters.status !== 'all') next.set('status', filters.status);
  if (filters.sort !== DEFAULT_FILTERS.sort) next.set('sort', filters.sort);
  if (filters.order !== DEFAULT_FILTERS.order) next.set('order', filters.order);
  if (filters.page && filters.page !== 1) next.set('page', String(filters.page));
  if (filters.limit && filters.limit !== DEFAULT_PAGE_SIZE) {
    next.set('limit', String(filters.limit));
  }
  return next;
}

export default function UsersPage() {
  const { user: actor } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => parseFilters(searchParams));
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [list, setList] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [activityEntries, setActivityEntries] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formTarget, setFormTarget] = useState(null);

  const [roleOpen, setRoleOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusNext, setStatusNext] = useState(USER_STATUS.INACTIVE);

  const [activityTarget, setActivityTarget] = useState(null);

  const canManage = hasPermission(actor, 'user.update');
  const canCreate = hasPermission(actor, 'user.create');

  // ----- stats -----------------------------------------------------
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await userService.stats();
      setStats(res.data);
    } catch {
      // Non-blocking: stats render gracefully without data.
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ----- list ------------------------------------------------------
  const loadList = useCallback(
    async (currentFilters) => {
      setListLoading(true);
      setListError(null);
      try {
        const res = await userService.list({
          page: currentFilters.page,
          limit: currentFilters.limit,
          search: currentFilters.search,
          role: currentFilters.role,
          status: currentFilters.status,
          sort: currentFilters.sort,
          order: currentFilters.order,
        });
        setList(res.data);
      } catch (err) {
        setListError(err);
      } finally {
        setListLoading(false);
      }
    },
    [],
  );

  // Keep URL in sync with filters (deep links survive reload).
  useEffect(() => {
    const next = serializeFilters(filters);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Reflect URL changes back into filters (handles browser back/forward).
  useEffect(() => {
    const fromUrl = parseFilters(searchParams);
    setFilters((prev) => {
      if (
        prev.search === fromUrl.search &&
        prev.role === fromUrl.role &&
        prev.status === fromUrl.status &&
        prev.sort === fromUrl.sort &&
        prev.order === fromUrl.order &&
        prev.page === fromUrl.page &&
        prev.limit === fromUrl.limit
      ) {
        return prev;
      }
      return fromUrl;
    });
    setSearchInput((cur) => (cur === fromUrl.search ? cur : fromUrl.search));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Push debounced search into filters so URL stays accurate.
  useEffect(() => {
    setFilters((prev) =>
      prev.search === debouncedSearch
        ? prev
        : { ...prev, search: debouncedSearch, page: 1 },
    );
  }, [debouncedSearch]);

  // Load list whenever filters change.
  useEffect(() => {
    loadList(filters);
  }, [filters, loadList]);

  // ----- activity (for the panel) ---------------------------------
  const loadActivityForTarget = useCallback(async (target) => {
    if (!target) return;
    setActivityLoading(true);
    try {
      const entries = await loadActivityForUser(target);
      setActivityEntries(entries);
    } catch {
      setActivityEntries([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activityTarget) loadActivityForTarget(activityTarget);
  }, [activityTarget, loadActivityForTarget]);

  // ----- mutators --------------------------------------------------
  const refreshAll = useCallback(async () => {
    await Promise.all([loadList(filters), loadStats()]);
  }, [filters, loadList, loadStats]);

  const handleCreate = () => {
    setFormMode('create');
    setFormTarget(null);
    setFormOpen(true);
  };

  const handleEdit = (user) => {
    setFormMode('edit');
    setFormTarget(user);
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    try {
      if (formMode === 'create') {
        const res = await userService.create(payload, actor);
        toast?.success?.(`User ${res.data?.name || ''} created.`);
      } else if (formTarget) {
        await userService.update(formTarget.id, payload, actor);
        toast?.success?.(`User ${payload.name} updated.`);
      }
      setFormOpen(false);
      await refreshAll();
    } catch (err) {
      // Re-throw so the form surfaces the server error.
      throw err;
    }
  };

  const handleChangeRole = (user) => {
    setRoleTarget(user);
    setRoleOpen(true);
  };

  const handleRoleConfirm = async (newRole) => {
    if (!roleTarget) return;
    try {
      await userService.changeRole(roleTarget.id, newRole, actor);
      toast?.success?.(`Role updated to ${newRole}.`);
      setRoleOpen(false);
      await refreshAll();
    } catch (err) {
      toast?.error?.(err?.message || 'Could not update role.');
    }
  };

  const handleChangeStatus = (user, next) => {
    setStatusTarget(user);
    setStatusNext(next);
    setStatusOpen(true);
  };

  const handleStatusConfirm = async (next) => {
    if (!statusTarget) return;
    try {
      await userService.changeStatus(statusTarget.id, next, actor);
      toast?.success?.('Status updated.');
      setStatusOpen(false);
      await refreshAll();
    } catch (err) {
      toast?.error?.(err?.message || 'Could not update status.');
    }
  };

  const handleViewActivity = (user) => {
    setActivityTarget(user);
    requestAnimationFrame(() => {
      document
        .getElementById('user-activity-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSortChange = (field) => {
    setFilters((prev) =>
      prev.sort === field
        ? {
            ...prev,
            order: prev.order === SORT_DIR.ASC ? SORT_DIR.DESC : SORT_DIR.ASC,
            page: 1,
          }
        : { ...prev, sort: field, page: 1 },
    );
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleReset = () => {
    setSearchInput('');
    setFilters({ ...DEFAULT_FILTERS });
  };

  const handleRefresh = async () => {
    await refreshAll();
    toast?.info?.('Users refreshed.');
  };

  // ----- derived --------------------------------------------------
  const rows = list?.items || [];
  const totalPages = list?.totalPages || 1;
  const lastAdminId = useMemo(() => {
    const admins = (list?.items || []).filter(
      (u) => u.role === ROLE.ADMIN && u.status === USER_STATUS.ACTIVE,
    );
    if (admins.length === 1) return admins[0].id;
    return null;
  }, [list]);

  const availableRolesFor = useCallback(
    (target) => userService.rolesAvailableFor(target, actor),
    [actor],
  );

  const isEmpty = !listLoading && !listError && rows.length === 0;

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Icon name="plus" size="sm" />}
        onClick={handleCreate}
        disabled={!canCreate}
        title={canCreate ? undefined : 'Only admins can create users.'}
      >
        New user
      </Button>
    </div>
  );

  return (
    <PageContainer
      title="Users"
      subtitle="Manage workspace members, roles, and access."
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Users' },
      ]}
      actions={headerActions}
    >
      <UserStats stats={stats} loading={statsLoading} />

      <Card padding="md">
        <CardBody>
          <UserFilters
            filters={{ ...filters, search: searchInput }}
            onSearchChange={setSearchInput}
            onRoleChange={(value) => setFilters((p) => ({ ...p, role: value, page: 1 }))}
            onStatusChange={(value) => setFilters((p) => ({ ...p, status: value, page: 1 }))}
            onSortChange={(value) => setFilters((p) => ({ ...p, sort: value, page: 1 }))}
            onOrderChange={(value) => setFilters((p) => ({ ...p, order: value, page: 1 }))}
            onReset={handleReset}
            onRefresh={handleRefresh}
            refreshing={listLoading}
          />
        </CardBody>
      </Card>

      {listError ? (
        <ErrorState
          title="Could not load users"
          description={listError?.message || 'Please try again.'}
          onRetry={() => loadList(filters)}
        />
      ) : (
        <Card padding="none">
          {/* Desktop table */}
          <div className="hidden lg:block">
            <UserTable
              rows={rows}
              loading={listLoading && !list}
              sort={filters.sort}
              order={filters.order}
              onSortChange={handleSortChange}
              currentUserId={actor?.id}
              canManage={canManage}
              lastAdminId={lastAdminId}
              onEdit={handleEdit}
              onChangeRole={handleChangeRole}
              onChangeStatus={handleChangeStatus}
              onViewActivity={handleViewActivity}
            />
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden p-3 space-y-3">
            {listLoading && !list ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            ) : rows.length === 0 ? null : (
              rows.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isSelf={user.id === actor?.id}
                  isLastAdmin={user.id === lastAdminId}
                  canManage={canManage}
                  onEdit={handleEdit}
                  onChangeRole={handleChangeRole}
                  onChangeStatus={handleChangeStatus}
                  onViewActivity={handleViewActivity}
                />
              ))
            )}
          </div>

          {list && list.total > 0 && (
            <div className="px-3 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
                <p className="text-xs text-text-muted">
                  Showing{' '}
                  <span className="text-text-secondary">
                    {(list.page - 1) * list.limit + 1}
                  </span>
                  –
                  <span className="text-text-secondary">
                    {Math.min(list.page * list.limit, list.total)}
                  </span>{' '}
                  of <span className="text-text-secondary">{list.total}</span>
                </p>
                <PaginationControls
                  page={list.page}
                  totalPages={totalPages}
                  limit={list.limit}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {isEmpty && (
        <EmptyState
          icon={<Icon name="users" size="md" />}
          title="No users match these filters"
          description="Try clearing search or selecting a different role/status."
          action={
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Icon name="x" size="sm" />}
              onClick={handleReset}
            >
              Reset filters
            </Button>
          }
        />
      )}

      {/* Activity panel */}
      {activityTarget && (
        <div id="user-activity-panel" className="space-y-3">
          <UserActivitySection
            user={activityTarget}
            entries={activityEntries}
            loading={activityLoading}
          />
        </div>
      )}

      {/* Dialogs */}
      <UserForm
        open={formOpen}
        mode={formMode}
        initial={formTarget}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <RoleChangeDialog
        open={roleOpen}
        user={roleTarget}
        availableRoles={roleTarget ? availableRolesFor(roleTarget) : []}
        isSelf={roleTarget?.id === actor?.id}
        isLastAdmin={roleTarget?.id === lastAdminId}
        onClose={() => setRoleOpen(false)}
        onConfirm={handleRoleConfirm}
      />

      <StatusChangeDialog
        open={statusOpen}
        user={statusTarget}
        isSelf={statusTarget?.id === actor?.id}
        isLastAdmin={statusTarget?.id === lastAdminId}
        onClose={() => setStatusOpen(false)}
        onConfirm={(next) => handleStatusConfirm(next ?? statusNext)}
      />
    </PageContainer>
  );
}

// ----- local pagination controls ------------------------------------
function PaginationControls({ page, totalPages, limit, onPageChange, onLimitChange }) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={limit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        className="h-8 text-xs rounded border border-border bg-bg-subtle text-text px-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
        aria-label="Page size"
      >
        {[10, 20, 50, 100].map((opt) => (
          <option key={opt} value={opt}>
            {opt} / page
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1">
        <Button
          size="xs"
          variant="ghost"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="text-xs text-text-muted px-2">
          Page {page} of {totalPages}
        </span>
        <Button
          size="xs"
          variant="ghost"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}