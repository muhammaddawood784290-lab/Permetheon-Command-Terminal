// =====================================================================
// BarChart — minimal SVG horizontal bar list.
//
// Each entry needs:
//   { label, value, sub? }
//
// The chart auto-scales so the longest bar fills the available width.
// Empty values render as a muted dashed placeholder rather than "0".
// =====================================================================

import { cn } from '../../utils/cn';

export default function BarChart({
  data = [],
  max,
  formatValue = (v) => v,
  barClass = 'bg-primary-500',
  emptyLabel = 'No data',
  className,
}) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className={cn('text-xs text-text-muted text-center py-6', className)}>
        {emptyLabel}
      </div>
    );
  }

  const computedMax =
    typeof max === 'number'
      ? max
      : data.reduce((acc, row) => (row.value > acc ? row.value : acc), 0);

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {data.map((row) => {
        const pct = computedMax > 0 ? Math.min(100, (row.value / computedMax) * 100) : 0;
        const isEmpty = !row.value;
        return (
          <div key={row.label} className="flex items-center gap-3 text-xs">
            <div className="w-32 shrink-0 text-text-secondary truncate" title={row.label}>
              {row.label}
            </div>
            <div className="flex-1 h-2 rounded-full bg-bg-hover overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-300',
                  isEmpty ? 'bg-bg-hover border border-dashed border-border' : barClass,
                )}
                style={{ width: `${isEmpty ? 100 : Math.max(pct, 4)}%` }}
              />
            </div>
            <div className="w-14 shrink-0 text-right font-mono tabular-nums text-text">
              {formatValue(row.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
