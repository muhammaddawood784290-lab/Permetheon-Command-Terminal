// =====================================================================
// ActivityContext — single source of truth for the system activity log.
//
// Activity entries are immutable per ACTIVITY_LOG.md, so this provider
// only exposes read helpers: the filtered list, paginated stats, the
// filter-options catalogue and a refresh() call. Anything that wants
// to read the timeline (the /activity page, future widgets, dashboards)
// goes through this provider so the filters and stats stay in sync.
//
// Filters are owned here so deep links from the topbar dropdown can
// push state in once and have every consumer react.
// =====================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import activityService from '../services/activityService';
import { useAuth } from './AuthContext';

const ActivityContext = createContext(null);

const DEFAULT_FILTERS = Object.freeze({
  search: '',
  actor: 'all',
  actions: [],
  targetTypes: [],
  project: 'all',
  dateFrom: '',
  dateTo: '',
  sort: 'createdAt',
  order: 'desc',
  page: 1,
  limit: 50,
});

const EMPTY_STATS = {
  totals: { total: 0, today: 0, uniqueActors: 0, uniqueActions: 0 },
  byCategory: {},
  byAction: {},
  byTargetType: {},
  topActors: [],
  last7Days: [],
};

const EMPTY_OPTIONS = {
  actors: [],
  actions: [],
  targetTypes: [],
  projects: [],
};

export function ActivityProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || null;

  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const loadOptions = useCallback(async () => {
    try {
      const res = await activityService.getFilterOptions();
      setOptions(res.data);
    } catch {
      setOptions(EMPTY_OPTIONS);
    }
  }, []);

  const refresh = useCallback(
    async (overrideFilters = null) => {
      const effective = overrideFilters || filters;
      setLoading(true);
      try {
        const res = await activityService.list(effective);
        setEntries(res.data.items || []);
        setTotal(res.data.total ?? (res.data.items || []).length);
      } catch {
        setEntries([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  const refreshStats = useCallback(
    async (overrideFilters = null) => {
      const effective = overrideFilters || filters;
      setStatsLoading(true);
      try {
        const res = await activityService.getStats(effective);
        setStats(res.data);
      } catch {
        setStats(EMPTY_STATS);
      } finally {
        setStatsLoading(false);
      }
    },
    [filters],
  );

  // Refetch when filters change. Stats refresh in parallel — both are
  // independent reads of the same dataset.
  useEffect(() => {
    refresh();
    refreshStats();
  }, [refresh, refreshStats]);

  // Pull filter options once on mount; they don't depend on the user.
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const value = useMemo(
    () => ({
      entries,
      stats,
      options,
      total,
      loading,
      statsLoading,
      filters,
      setFilters,
      resetFilters,
      refresh,
      refreshStats,
    }),
    [entries, stats, options, total, loading, statsLoading, filters, resetFilters, refresh, refreshStats],
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used inside <ActivityProvider>.');
  return ctx;
}

export { DEFAULT_FILTERS };
export default ActivityContext;