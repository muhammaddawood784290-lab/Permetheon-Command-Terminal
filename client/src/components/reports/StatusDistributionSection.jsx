// =====================================================================
// StatusDistributionSection — donut + summary table for task status.
// =====================================================================

import Card, { CardHeader, CardTitle, CardBody } from '../ui/Card';
import { DonutChart } from '../charts';
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
} from '../../utils/constants';

const STATUS_COLORS = {
  BACKLOG: '#64748b',
  TODO: '#3b82f6',
  IN_PROGRESS: '#6366f1',
  IN_REVIEW: '#f59e0b',
  REVISION_REQUIRED: '#ef4444',
  COMPLETED: '#22c55e',
  BLOCKED: '#b91c1c',
  CANCELLED: '#475569',
};

export default function StatusDistributionSection({ data, loading }) {
  const total = data?.total ?? 0;
  const distribution = data?.distribution || [];
  const slices = distribution.map((row) => ({
    label: TASK_STATUS_LABELS[row.status] || row.status,
    value: row.count,
    color: STATUS_COLORS[row.status] || '#64748b',
  }));

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle subtitle="Tasks by current status">
          Task status distribution
        </CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-bg-hover rounded animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-bg-hover rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <DonutChart
              data={slices}
              centerLabel="Tasks"
              centerValue={total}
              emptyLabel="No tasks for these filters."
            />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-text-muted text-left">
                  <tr>
                    <th className="py-1.5 font-medium">Status</th>
                    <th className="py-1.5 font-medium text-right">Count</th>
                    <th className="py-1.5 font-medium text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {distribution.map((row) => (
                    <tr key={row.status}>
                      <td className="py-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded border text-2xs uppercase tracking-wide ${
                            TASK_STATUS_STYLES[row.status] || 'border-border text-text-muted'
                          }`}
                        >
                          {TASK_STATUS_LABELS[row.status] || row.status}
                        </span>
                      </td>
                      <td className="py-1.5 text-right font-mono tabular-nums">{row.count}</td>
                      <td className="py-1.5 text-right font-mono tabular-nums text-text-muted">
                        {total > 0 ? `${Math.round((row.count / total) * 1000) / 10}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
