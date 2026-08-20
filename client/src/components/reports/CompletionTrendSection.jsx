// =====================================================================
// CompletionTrendSection — line chart + KPI block for "last 14 days
// of completed tasks".
// =====================================================================

import Card, { CardHeader, CardTitle, CardBody } from '../ui/Card';
import { LineChart } from '../charts';

export default function CompletionTrendSection({ data, loading }) {
  const points = data?.points || [];
  const total = points.reduce((sum, p) => sum + p.count, 0);
  const avg = points.length ? Math.round((total / points.length) * 10) / 10 : 0;

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle subtitle="Daily completions over the last 14 days">
          Completion trend
        </CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="h-24 bg-bg-hover rounded animate-pulse" />
        ) : (
          <>
            <LineChart points={points} />
            <div className="flex justify-between gap-4 text-xs text-text-muted mt-3 pt-3 border-t border-border-subtle">
              <div>
                <div className="uppercase tracking-wide text-2xs">Completed</div>
                <div className="text-lg font-semibold text-text">{total}</div>
              </div>
              <div>
                <div className="uppercase tracking-wide text-2xs">Per day (avg)</div>
                <div className="text-lg font-semibold text-text">{avg}</div>
              </div>
              <div>
                <div className="uppercase tracking-wide text-2xs">Window</div>
                <div className="text-lg font-semibold text-text">14 days</div>
              </div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}