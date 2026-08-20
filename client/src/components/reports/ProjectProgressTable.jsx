// =====================================================================
// ProjectProgressTable — sortable list of every project with task
// counters and a progress bar. Honors the export click via the
// `onExport` callback so the page can wire up the CSV download.
// =====================================================================

import { useMemo, useState } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../ui/Card';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { ProgressBar } from '../charts';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
} from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';

const COLUMNS = [
  { key: 'name', label: 'Project' },
  { key: 'status', label: 'Status' },
  { key: 'taskCount', label: 'Tasks' },
  { key: 'completed', label: 'Done' },
  { key: 'open', label: 'Open' },
  { key: 'review', label: 'In review' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'progress', label: 'Progress' },
];

function sortRows(rows, key, direction) {
  const dir = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av || '').localeCompare(String(bv || '')) * dir;
  });
}

export default function ProjectProgressTable({ rows = [], loading, onExport }) {
  const [sortKey, setSortKey] = useState('open');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => sortRows(rows, sortKey, sortDir), [rows, sortKey, sortDir]);

  function toggleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'status' ? 'asc' : 'desc');
    }
  }

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle subtitle="Per-project progress and workload">
          Project progress
        </CardTitle>
        <Button
          size="xs"
          variant="ghost"
          leftIcon={<Icon name="download" size="sm" />}
          onClick={onExport}
          disabled={!rows.length}
        >
          Export CSV
        </Button>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 bg-bg-hover rounded animate-pulse" />
            ))}
          </div>
        ) : !rows.length ? (
          <div className="text-xs text-text-muted text-center py-8">
            No projects match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-text-muted text-left">
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="py-1.5 pr-3 font-medium">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-text"
                        onClick={() => toggleSort(col.key)}
                      >
                        {col.label}
                        {sortKey === col.key && (
                          <Icon
                            name={sortDir === 'asc' ? 'arrowUp' : 'arrowDown'}
                            size="xs"
                          />
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {sorted.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-3">
                      <div className="flex flex-col">
                        <span className="text-text font-medium">{row.name}</span>
                        <span className="text-2xs text-text-muted">
                          {row.code} · due {row.deadline ? formatDate(row.deadline) : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-2xs uppercase tracking-wide ${
                          PROJECT_STATUS_STYLES[row.status] || 'border-border text-text-muted'
                        }`}
                      >
                        {PROJECT_STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-mono tabular-nums">{row.taskCount}</td>
                    <td className="py-2 pr-3 font-mono tabular-nums text-success-light">{row.completed}</td>
                    <td className="py-2 pr-3 font-mono tabular-nums">{row.open}</td>
                    <td className="py-2 pr-3 font-mono tabular-nums text-warning-light">{row.review}</td>
                    <td
                      className={`py-2 pr-3 font-mono tabular-nums ${
                        row.overdue > 0 ? 'text-danger-light' : 'text-text-muted'
                      }`}
                    >
                      {row.overdue}
                    </td>
                    <td className="py-2 pr-3 w-40">
                      <ProgressBar value={row.progress} tone="primary" showLabel />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
