// =====================================================================
// ReportFilters — date range, project, developer, status, priority,
// and refresh. Pure presentational: parent owns values + onChange
// handlers and computes the has-active-filters flag if needed.
// =====================================================================

import { useMemo } from 'react';
import Select from '../ui/Select';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_LIST,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_LIST,
} from '../../utils/constants';

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];

export default function ReportFilters({
  filters,
  onFiltersChange,
  options = {},
  onRefresh,
  refreshing = false,
}) {
  const projects = options.projects || [];
  const developers = options.developers || [];

  const projectOptions = useMemo(
    () => [
      { value: 'all', label: 'All projects' },
      ...projects.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` })),
    ],
    [projects],
  );

  const developerOptions = useMemo(
    () => [
      { value: 'all', label: 'All developers' },
      ...developers.map((u) => ({ value: u.id, label: `${u.name} · ${u.title || u.role}` })),
    ],
    [developers],
  );

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All statuses' },
      ...TASK_STATUS_LIST.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] || s })),
    ],
    [],
  );

  const priorityOptions = useMemo(
    () => [
      { value: 'all', label: 'All priorities' },
      ...TASK_PRIORITY_LIST.map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] || p })),
    ],
    [],
  );

  function update(patch) {
    if (onFiltersChange) onFiltersChange({ ...filters, ...patch });
  }

  const hasActiveFilters =
    filters.dateRange !== 'all' ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    (filters.projectId && filters.projectId !== 'all') ||
    (filters.developerId && filters.developerId !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.priority && filters.priority !== 'all');

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Select
          label="Date range"
          value={filters.dateRange}
          onChange={(e) => update({ dateRange: e.target.value })}
          options={DATE_RANGE_OPTIONS}
        />
        <Select
          label="Project"
          value={filters.projectId}
          onChange={(e) => update({ projectId: e.target.value })}
          options={projectOptions}
        />
        <Select
          label="Developer"
          value={filters.developerId}
          onChange={(e) => update({ developerId: e.target.value })}
          options={developerOptions}
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) => update({ status: e.target.value })}
          options={statusOptions}
        />
        <Select
          label="Priority"
          value={filters.priority}
          onChange={(e) => update({ priority: e.target.value })}
          options={priorityOptions}
        />
      </div>

      {filters.dateRange === 'custom' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            type="date"
            label="From"
            value={filters.dateFrom || ''}
            onChange={(e) => update({ dateFrom: e.target.value })}
          />
          <Input
            type="date"
            label="To"
            value={filters.dateTo || ''}
            onChange={(e) => update({ dateTo: e.target.value })}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
        <div>
          {hasActiveFilters ? 'Filters applied — see results below.' : 'Showing full dataset.'}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              size="xs"
              variant="ghost"
              leftIcon={<Icon name="x" size="sm" />}
              onClick={() =>
                onFiltersChange &&
                onFiltersChange({
                  dateRange: 'all',
                  dateFrom: '',
                  dateTo: '',
                  projectId: 'all',
                  developerId: 'all',
                  status: 'all',
                  priority: 'all',
                })
              }
            >
              Reset
            </Button>
          )}
          <Button
            size="xs"
            variant="ghost"
            leftIcon={<Icon name="refresh" size="sm" />}
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>
    </div>
  );
}
