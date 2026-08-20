// =====================================================================
// DeveloperWorkloadTable — per-developer workload counters with a
// horizontal bar chart for "Open tasks". Honors `onExport` for CSV.
// =====================================================================

import { useMemo, useState } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../ui/Card';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { BarChart } from '../charts';
import { ROLE_LABELS } from '../../utils/constants';

const COLUMNS = [
  { key: 'name', label: 'Developer' },
  { key: 'role', label: 'Role' },
  { key: 'openTasks', label: 'Open' },
  { key: 'inProgress', label: 'In progress' },
  { key: 'review', label: 'Review' },
  { key: 'revision', label: 'Revision' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
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

export default function DeveloperWorkloadTable({ rows = [], loading, onExport }) {
  const [sortKey, setSortKey] = useState('openTasks');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => sortRows(rows, sortKey, sortDir), [rows, sortKey, sortDir]);
  const chartData = useMemo(
    () =>
      rows
        .map((r) => ({ label: r.name, value: r.openTasks }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    [rows],
  );

  function toggleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'role' ? 'asc' : 'desc');
    }
  }

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle subtitle="Active workload per developer">
          Developer workload
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
            No developers found for these filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 overflow-x-auto">
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
                    <tr key={row.userId}>
                      <td className="py-2 pr-3">
                        <div className="flex flex-col">
                          <span className="text-text font-medium">{row.name}</span>
                          <span className="text-2xs text-text-muted">{row.title || ''}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-text-secondary">{ROLE_LABELS[row.role] || row.role}</td>
                      <td className="py-2 pr-3 font-mono tabular-nums">{row.openTasks}</td>
                      <td className="py-2 pr-3 font-mono tabular-nums">{row.inProgress}</td>
                      <td className="py-2 pr-3 font-mono tabular-nums text-warning-light">{row.review}</td>
                      <td className="py-2 pr-3 font-mono tabular-nums text-danger-light">{row.revision}</td>
                      <td className="py-2 pr-3 font-mono tabular-nums text-success-light">{row.completed}</td>
                      <td
                        className={`py-2 pr-3 font-mono tabular-nums ${
                          row.overdue > 0 ? 'text-danger-light' : 'text-text-muted'
                        }`}
                      >
                        {row.overdue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wide text-text-muted mb-2">
                Open tasks (top 10)
              </h4>
              <BarChart
                data={chartData}
                emptyLabel="No open tasks"
                barClass="bg-primary-500"
              />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
