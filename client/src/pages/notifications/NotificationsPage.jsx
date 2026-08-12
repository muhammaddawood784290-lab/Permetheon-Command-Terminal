// =====================================================================
// NotificationsPage — /notifications
//
// Full notification center. Owns the URL state, the filter inputs, the
// confirm dialog for destructive actions, and orchestrates the layout
// (stats → filters → list). The notification data and mutation helpers
// come from NotificationContext so the topbar bell stays in sync —
// every action taken here is reflected in the bell badge instantly.
// =====================================================================

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import PageContainer from '../../layouts/PageContainer';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

import NotificationStats from '../../components/notifications/NotificationStats';
import NotificationFilters from '../../components/notifications/NotificationFilters';
import NotificationList from '../../components/notifications/NotificationList';

import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { SORT_DIR } from '../../utils/constants';

const VALID_READ = ['all', 'unread', 'read'];

export default function NotificationsPage() {
  const { push } = useToast();
  const {
    notifications,
    loading,
    filters: contextFilters,
    setFilters: setContextFilters,
    refresh,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    remove,
    clearRead,
  } = useNotifications();

  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ----- local filter state (URL-aware) -----------------------------
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  const initialRead = (() => {
    const v = searchParams.get('read');
    return VALID_READ.includes(v) ? v : 'all';
  })();
  const initialType = searchParams.get('type') || 'all';
  const initialTarget = searchParams.get('target') || 'all';

  const [read, setRead] = useState(initialRead);
  const [type, setType] = useState(initialType);
  const [targetType, setTargetType] = useState(initialTarget);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState(SORT_DIR.DESC);

  // ----- sync filters to URL (deep links from stat cards) -----------
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('q', debouncedSearch);
    else next.delete('q');
    if (read !== 'all') next.set('read', read);
    else next.delete('read');
    if (type !== 'all') next.set('type', type);
    else next.delete('type');
    if (targetType !== 'all') next.set('target', targetType);
    else next.delete('target');
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, read, type, targetType]);

  // Mirror external URL changes back to local state so deep links
  // (e.g. /notifications?read=unread) work on direct load.
  useEffect(() => {
    const urlRead = searchParams.get('read');
    setRead(VALID_READ.includes(urlRead) ? urlRead : 'all');
    setType(searchParams.get('type') || 'all');
    setTargetType(searchParams.get('target') || 'all');
    setSearchInput(searchParams.get('q') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ----- push filters into context ---------------------------------
  const composedFilters = useMemo(
    () => ({
      search: debouncedSearch,
      read,
      type,
      targetType,
      sort,
      order,
      page: 1,
      limit: 100,
    }),
    [debouncedSearch, read, type, targetType, sort, order],
  );

  useEffect(() => {
    setContextFilters(composedFilters);
  }, [composedFilters, setContextFilters]);

  // Refresh local notification list (used after destructive actions).
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    refresh();
  }, [refresh]);

  // ----- mutations --------------------------------------------------
  const handleMarkAsRead = async (n) => {
    await markAsRead(n.id);
  };

  const handleMarkAsUnread = async (n) => {
    await markAsUnread(n.id);
  };

  const handleRemove = (n) => {
    setConfirm({
      title: 'Remove notification',
      message: `Remove "${n.title}" from your inbox? This cannot be undone.`,
      confirmLabel: 'Remove',
      variant: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          await remove(n.id);
          push({ type: 'success', message: 'Notification removed.' });
        } catch (err) {
          push({ type: 'error', message: err.message || 'Could not remove notification.' });
        } finally {
          setActionLoading(false);
          setConfirm(null);
        }
      },
    });
  };

  const handleMarkAllRead = () => {
    setConfirm({
      title: 'Mark all as read',
      message: 'Mark every notification in your inbox as read? This cannot be undone.',
      confirmLabel: 'Mark all read',
      variant: 'primary',
      action: async () => {
        setActionLoading(true);
        try {
          await markAllAsRead();
          push({ type: 'success', message: 'All notifications marked as read.' });
        } catch (err) {
          push({ type: 'error', message: err.message || 'Could not mark notifications as read.' });
        } finally {
          setActionLoading(false);
          setConfirm(null);
        }
      },
    });
  };

  const handleClearRead = () => {
    setConfirm({
      title: 'Clear read notifications',
      message: 'Remove every read notification from your inbox? Unread notifications will be kept.',
      confirmLabel: 'Clear read',
      variant: 'danger',
      action: async () => {
        setActionLoading(true);
        try {
          await clearRead();
          push({ type: 'success', message: 'Read notifications cleared.' });
        } catch (err) {
          push({ type: 'error', message: err.message || 'Could not clear read notifications.' });
        } finally {
          setActionLoading(false);
          setConfirm(null);
        }
      },
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setRead('all');
    setType('all');
    setTargetType('all');
  };

  const hasActiveFilters =
    Boolean(searchInput) ||
    (read && read !== 'all') ||
    (type && type !== 'all') ||
    (targetType && targetType !== 'all');

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Icon name="refresh" size="sm" />}
        onClick={handleRefresh}
        aria-label="Refresh notifications"
      >
        Refresh
      </Button>
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Icon name="trash" size="sm" />}
        onClick={handleClearRead}
        disabled={!notifications.some((n) => n.read)}
      >
        Clear read
      </Button>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Icon name="check" size="sm" />}
        onClick={handleMarkAllRead}
        disabled={!notifications.some((n) => !n.read)}
      >
        Mark all read
      </Button>
    </div>
  );

  // The notifications context already handles loading + filtering.
  // We use it as the canonical source so the topbar bell stays in sync.
  const error = null;
  const totalCount = contextFilters?.total ?? notifications.length;
  const filteredCount = notifications.length;
  const visibleItems = notifications;

  return (
    <PageContainer
      title="Notifications"
      subtitle="Updates, mentions, and review requests. Single inbox — the bell in the topbar reads from the same source."
      actions={headerActions}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Notifications' },
      ]}
    >
      <NotificationStats refreshKey={refreshKey} />

      <Card padding="md">
        <CardBody>
          <NotificationFilters
            search={searchInput}
            onSearchChange={setSearchInput}
            read={read}
            onReadChange={setRead}
            type={type}
            onTypeChange={setType}
            targetType={targetType}
            onTargetTypeChange={setTargetType}
            sort={sort}
            onSortChange={setSort}
            order={order}
            onOrderChange={setOrder}
            onReset={handleResetFilters}
            totalCount={totalCount}
            filteredCount={filteredCount}
          />
        </CardBody>
      </Card>

      {error ? (
        <ErrorState
          title="Could not load notifications"
          description={error.message}
          onRetry={handleRefresh}
        />
      ) : loading ? (
        <Card>
          <CardBody>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-md bg-bg-hover animate-pulse" />
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        <NotificationList
          notifications={visibleItems}
          loading={loading}
          emptyTitle={hasActiveFilters ? 'No notifications match these filters' : 'You are all caught up'}
          emptyDescription={
            hasActiveFilters
              ? 'Try clearing the search or filter to see more results.'
              : 'New updates, mentions, and review requests will appear here.'
          }
          emptyAction={
            hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                Clear filters
              </Button>
            ) : null
          }
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
          onRemove={handleRemove}
        />
      )}

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
