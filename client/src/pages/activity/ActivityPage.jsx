// =====================================================================
// ActivityPage — /activity
//
// System-wide audit timeline. Owns the URL state, the filter inputs,
// the toast wiring for non-mutating actions, and orchestrates the
// layout (stats → filters → timeline). The data comes from
// ActivityContext so the page is purely a view layer.
//
// URL contract:
//   q           — search
//   actor       — actorId or "all"
//   actions     — comma-separated action list
//   category    — single category, expanded to all actions in it
//   targetType  — task / project / user / etc.
//   project     — projectId or "all"
//   from        — ISO date (YYYY-MM-DD)
//   to          — ISO date (YYYY-MM-DD)
//   sort        — createdAt | action | actorName | targetLabel
//   order       — asc | desc
//
// All filters are two-way bound: writing to the URL updates the
// context, and external URL changes (e.g. clicking a stat card) flow
// back into the local state via the search-params effect.
// =====================================================================

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import PageContainer from '../../layouts/PageContainer';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';

import ActivityStats from '../../components/activity/ActivityStats';
import ActivityFilters from '../../components/activity/ActivityFilters';
import ActivityTimeline from '../../components/activity/ActivityTimeline';

import { useActivity } from '../../context/ActivityContext';
import { useDebounce } from '../../hooks/useDebounce';
import { SORT_DIR } from '../../utils/constants';
import { ACTIVITY_ACTION_CATEGORY_MAP } from '../../utils/constants';
import { mockActivity } from '../../mock/mockData';

const VALID_TARGET_TYPES = new Set([
  'all',
  'task',
  'project',
  'user',
  'comment',
  'file',
  'review',
  'notification',
]);

const VALID_SORT_FIELDS = new Set(['createdAt', 'action', 'actorName', 'targetLabel']);

/**
 * Expand a category token into the full action list so the page can
 * filter by "everything in the REVIEW bucket" in one click.
 */
function categoryActions(category) {
  if (!category || category === 'all') return [];
  return Object.entries(ACTIVITY_ACTION_CATEGORY_MAP)
    .filter(([, cat]) => cat === category)
    .map(([action]) => action);
}

export default function ActivityPage() {
  const {
    entries,
    total,
    loading,
    filters,
    setFilters,
    resetFilters,
    refresh,
    options,
  } = useActivity();

  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState(null);

  // ----- local filter state (URL-aware) -----------------------------
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  const initialActor = searchParams.get('actor') || 'all';
  const initialTargetType = (() => {
    const v = searchParams.get('targetType') || 'all';
    return VALID_TARGET_TYPES.has(v) ? v : 'all';
  })();
  const initialProject = searchParams.get('project') || 'all';
  const initialSort = (() => {
    const v = searchParams.get('sort') || 'createdAt';
    return VALID_SORT_FIELDS.has(v) ? v : 'createdAt';
  })();
  const initialOrder = searchParams.get('order') === SORT_DIR.ASC ? SORT_DIR.ASC : SORT_DIR.DESC;
  const initialDateFrom = searchParams.get('from') || '';
  const initialDateTo = searchParams.get('to') || '';

  const initialActions = useMemo(() => {
    const list = searchParams.get('actions');
    if (list) return list.split(',').filter(Boolean);
    const cat = searchParams.get('category');
    if (cat) return categoryActions(cat);
    return [];
  }, [searchParams]);

  const [actor, setActor] = useState(initialActor);
  const [targetType, setTargetType] = useState(initialTargetType);
  const [project, setProject] = useState(initialProject);
  const [sort, setSort] = useState(initialSort);
  const [order, setOrder] = useState(initialOrder);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [actions, setActions] = useState(initialActions);

  // ----- sync filters to URL ----------------------------------------
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch) next.set('q', debouncedSearch); else next.delete('q');
    if (actor !== 'all') next.set('actor', actor); else next.delete('actor');
    if (targetType !== 'all') next.set('targetType', targetType); else next.delete('targetType');
    if (project !== 'all') next.set('project', project); else next.delete('project');
    if (dateFrom) next.set('from', dateFrom); else next.delete('from');
    if (dateTo) next.set('to', dateTo); else next.delete('to');
    if (sort !== 'createdAt') next.set('sort', sort); else next.delete('sort');
    if (order !== SORT_DIR.DESC) next.set('order', order); else next.delete('order');
    if (actions.length > 0) next.set('actions', actions.join(',')); else next.delete('actions');
    next.delete('category'); // Single-use hint, never persist.

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, actor, targetType, project, dateFrom, dateTo, sort, order, actions]);

  // Mirror external URL changes back into local state so deep links
  // (e.g. /activity?category=REVIEW) work on direct load.
  useEffect(() => {
    const urlRead = searchParams;
    setSearchInput(urlRead.get('q') || '');
    setActor(urlRead.get('actor') || 'all');
    const tt = urlRead.get('targetType') || 'all';
    setTargetType(VALID_TARGET_TYPES.has(tt) ? tt : 'all');
    setProject(urlRead.get('project') || 'all');
    const s = urlRead.get('sort') || 'createdAt';
    setSort(VALID_SORT_FIELDS.has(s) ? s : 'createdAt');
    setOrder(urlRead.get('order') === SORT_DIR.ASC ? SORT_DIR.ASC : SORT_DIR.DESC);
    setDateFrom(urlRead.get('from') || '');
    setDateTo(urlRead.get('to') || '');

    const actionsParam = urlRead.get('actions');
    if (actionsParam) {
      setActions(actionsParam.split(',').filter(Boolean));
    } else {
      const cat = urlRead.get('category');
      setActions(cat ? categoryActions(cat) : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ----- push filters into context ---------------------------------
  const composedFilters = useMemo(
    () => ({
      search: debouncedSearch,
      actor,
      actions,
      targetType,
      project,
      dateFrom,
      dateTo,
      sort,
      order,
      page: 1,
      limit: 100,
    }),
    [debouncedSearch, actor, actions, targetType, project, dateFrom, dateTo, sort, order],
  );

  useEffect(() => {
    setFilters(composedFilters);
  }, [composedFilters, setFilters]);

  // ----- handlers ---------------------------------------------------
  const handleRefresh = useCallback(async () => {
    setError(null);
    try {
      await refresh();
    } catch (err) {
      setError(err);
    }
  }, [refresh]);

  const handleResetFilters = () => {
    setSearchInput('');
    setActor('all');
    setTargetType('all');
    setProject('all');
    setDateFrom('');
    setDateTo('');
    setActions([]);
    setSort('createdAt');
    setOrder(SORT_DIR.DESC);
  };

  const hasActiveFilters =
    Boolean(searchInput) ||
    (actor && actor !== 'all') ||
    (targetType && targetType !== 'all') ||
    (project && project !== 'all') ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    (Array.isArray(actions) && actions.length > 0);

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Icon name="refresh" size="sm" />}
        onClick={handleRefresh}
        aria-label="Refresh activity"
      >
        Refresh
      </Button>
    </div>
  );

  return (
    <PageContainer
      title="Activity"
      subtitle="Audit trail of every change across projects, tasks, reviews and the system. Filter, sort, and search to find what happened."
      actions={headerActions}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Activity' },
      ]}
    >
      <ActivityStats />

      <Card padding="md">
        <CardBody>
          <ActivityFilters
            search={searchInput}
            onSearchChange={setSearchInput}
            actor={actor}
            onActorChange={setActor}
            actions={actions}
            onActionsChange={setActions}
            targetType={targetType}
            onTargetTypeChange={setTargetType}
            project={project}
            onProjectChange={setProject}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            sort={sort}
            onSortChange={setSort}
            order={order}
            onOrderChange={setOrder}
            onReset={handleResetFilters}
            options={options}
            totalCount={mockActivity.length}
            filteredCount={total}
          />
        </CardBody>
      </Card>

      {error ? (
        <ErrorState
          title="Could not load activity"
          description={error.message}
          onRetry={handleRefresh}
        />
      ) : loading ? (
        <Card>
          <CardBody>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 rounded-md bg-bg-hover animate-pulse" />
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        <ActivityTimeline
          entries={entries}
          loading={loading}
          emptyTitle={hasActiveFilters ? 'No activity matches these filters' : 'No activity yet'}
          emptyDescription={
            hasActiveFilters
              ? 'Try clearing the search or filter to see more events.'
              : 'System events will appear here as your team works.'
          }
          emptyAction={
            hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      )}
    </PageContainer>
  );
}