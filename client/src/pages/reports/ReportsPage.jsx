// =====================================================================
// ReportsPage — /reports
//
// Operational dashboard per REPORTS.md sections 5–16. The page owns
// the filter state, URL syncs the filters so links remain shareable,
// and stitches together every chart/table section so they all
// recompute when the filters change.
//
// All sections read from a single `fullReport()` call so the page
// only shows one loading state and updates are atomic.
// =====================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import PageContainer from '../../layouts/PageContainer';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { useToast } from '../../context/ToastContext';

import ReportFilters from '../../components/reports/ReportFilters';
import ReportKPIs from '../../components/reports/ReportKPIs';
import StatusDistributionSection from '../../components/reports/StatusDistributionSection';
import ProjectProgressTable from '../../components/reports/ProjectProgressTable';
import DeveloperWorkloadTable from '../../components/reports/DeveloperWorkloadTable';
import ReviewQueueSection from '../../components/reports/ReviewQueueSection';
import DeadlineSection from '../../components/reports/DeadlineSection';
import CompletionTrendSection from '../../components/reports/CompletionTrendSection';
import ActivityOverviewSection from '../../components/reports/ActivityOverviewSection';

import reportService from '../../services/reportService';
import { downloadCsv } from '../../utils/csvExport';
import { useDebounce } from '../../hooks/useDebounce';
import { hasPermission } from '../../utils/permissions';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_FILTERS = {
  dateRange: 'all',
  dateFrom: '',
  dateTo: '',
  projectId: 'all',
  developerId: 'all',
  status: 'all',
  priority: 'all',
};

function parseFiltersFromQuery(searchParams) {
  return {
    dateRange: searchParams.get('dateRange') || DEFAULT_FILTERS.dateRange,
    dateFrom: searchParams.get('dateFrom') || DEFAULT_FILTERS.dateFrom,
    dateTo: searchParams.get('dateTo') || DEFAULT_FILTERS.dateTo,
    projectId: searchParams.get('projectId') || DEFAULT_FILTERS.projectId,
    developerId: searchParams.get('developerId') || DEFAULT_FILTERS.developerId,
    status: searchParams.get('status') || DEFAULT_FILTERS.status,
    priority: searchParams.get('priority') || DEFAULT_FILTERS.priority,
  };
}

function serializeFiltersToQuery(filters) {
  const next = new URLSearchParams();
  if (filters.dateRange !== DEFAULT_FILTERS.dateRange) next.set('dateRange', filters.dateRange);
  if (filters.dateFrom) next.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) next.set('dateTo', filters.dateTo);
  if (filters.projectId !== DEFAULT_FILTERS.projectId) next.set('projectId', filters.projectId);
  if (filters.developerId !== DEFAULT_FILTERS.developerId) next.set('developerId', filters.developerId);
  if (filters.status !== DEFAULT_FILTERS.status) next.set('status', filters.status);
  if (filters.priority !== DEFAULT_FILTERS.priority) next.set('priority', filters.priority);
  return next;
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();

  const [filters, setFilters] = useState(() => parseFiltersFromQuery(searchParams));
  const [options, setOptions] = useState({ projects: [], developers: [] });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Debounce date+filter changes so we don't fire 6 reports per
  // keystroke. 250ms is short enough to feel instant but long enough
  // to coalesce a quick filter sweep.
  const debouncedFilters = useDebounce(filters, 250);

  // ----- load filter options once ---------------------------------
  useEffect(() => {
    let cancelled = false;
    reportService
      .filterOptions()
      .then((res) => {
        if (cancelled) return;
        setOptions(res.data || { projects: [], developers: [] });
      })
      .catch(() => {
        if (cancelled) return;
        setOptions({ projects: [], developers: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ----- URL sync --------------------------------------------------
  useEffect(() => {
    const next = serializeFiltersToQuery(filters);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ----- mirror URL back into state (deep links) -----------------
  useEffect(() => {
    setFilters(parseFiltersFromQuery(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ----- load report whenever debounced filters change -----------
  const loadReport = useCallback(async (currentFilters, { background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await reportService.fullReport(currentFilters);
      setReport(res.data || null);
    } catch (err) {
      setError(err);
    } finally {
      if (background) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(debouncedFilters);
  }, [debouncedFilters, loadReport]);

  const handleRefresh = useCallback(() => {
    loadReport(filters, { background: true });
    toast?.info?.('Reports refreshed.');
  }, [filters, loadReport, toast]);

  const canExport = useMemo(() => hasPermission(user, 'report.export'), [user]);

  // ----- CSV exports ---------------------------------------------
  const exportProjectsCsv = useCallback(() => {
    const rows = report?.projectReport?.rows || [];
    if (!rows.length) return;
    const headers = [
      'Project',
      'Code',
      'Status',
      'Tasks',
      'Open',
      'Completed',
      'In progress',
      'In review',
      'Overdue',
      'Progress (%)',
      'Deadline',
    ];
    const data = rows.map((r) => [
      r.name,
      r.code,
      r.status,
      r.taskCount,
      r.open,
      r.completed,
      r.inProgress,
      r.review,
      r.overdue,
      r.progress,
      r.deadline || '',
    ]);
    downloadCsv(`projects-report-${new Date().toISOString().slice(0, 10)}.csv`, headers, data);
    toast?.success?.('Project report exported.');
  }, [report, toast]);

  const exportDevelopersCsv = useCallback(() => {
    const rows = report?.developerReport?.rows || [];
    if (!rows.length) return;
    const headers = [
      'Developer',
      'Role',
      'Title',
      'Total',
      'Open',
      'In progress',
      'Review',
      'Revision',
      'Completed',
      'Overdue',
    ];
    const data = rows.map((r) => [
      r.name,
      r.role,
      r.title || '',
      r.total,
      r.openTasks,
      r.inProgress,
      r.review,
      r.revision,
      r.completed,
      r.overdue,
    ]);
    downloadCsv(`developer-workload-${new Date().toISOString().slice(0, 10)}.csv`, headers, data);
    toast?.success?.('Developer workload exported.');
  }, [report, toast]);

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Icon name="refresh" size="sm" />}
        onClick={handleRefresh}
        disabled={refreshing || loading}
      >
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </Button>
    </div>
  );

  // ----- rendering -----------------------------------------------
  const hasAnyData = report && (
    (report.overview?.tasks?.total ?? 0) > 0 ||
    (report.overview?.projects?.total ?? 0) > 0 ||
    (report.activityReport?.total ?? 0) > 0
  );

  return (
    <PageContainer
      title="Reports"
      subtitle="Operational analytics across projects, tasks, developers, and reviews. All metrics are calculated from current application data."
      actions={headerActions}
      breadcrumbs={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Reports' },
      ]}
    >
      <Card padding="md">
        <CardBody>
          <ReportFilters
            filters={filters}
            onFiltersChange={setFilters}
            options={options}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        </CardBody>
      </Card>

      {error ? (
        <ErrorState
          title="Could not load reports"
          description={error?.message || 'Please try again.'}
          onRetry={() => loadReport(filters)}
        />
      ) : loading && !report ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-text-muted">
              <Icon name="refresh" size="lg" />
              <span>Loading reports…</span>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <ReportKPIs overview={report?.overview} loading={loading && !report} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatusDistributionSection
              data={report?.statusDistribution}
              loading={loading && !report}
            />
            <CompletionTrendSection
              data={report?.completionTrend}
              loading={loading && !report}
            />
          </div>

          <ProjectProgressTable
            rows={report?.projectReport?.rows || []}
            loading={loading && !report}
            onExport={canExport ? exportProjectsCsv : null}
          />

          <DeveloperWorkloadTable
            rows={report?.developerReport?.rows || []}
            loading={loading && !report}
            onExport={canExport ? exportDevelopersCsv : null}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReviewQueueSection
              data={report?.reviewReport}
              loading={loading && !report}
            />
            <DeadlineSection
              data={report?.deadlineReport}
              loading={loading && !report}
            />
          </div>

          <ActivityOverviewSection
            data={report?.activityReport}
            loading={loading && !report}
          />

          {!hasAnyData && !loading && (
            <EmptyState
              icon={<Icon name="search" size="md" />}
              title="No data for these filters"
              description="Try widening the date range or clearing the project/developer filters."
              action={
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Icon name="x" size="sm" />}
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                >
                  Reset filters
                </Button>
              }
            />
          )}
        </div>
      )}
    </PageContainer>
  );
}
