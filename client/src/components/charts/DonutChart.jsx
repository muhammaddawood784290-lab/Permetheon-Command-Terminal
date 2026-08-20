// =====================================================================
// DonutChart — SVG donut for status distribution.
//
// Each slice needs { label, value, color }. Slices with value 0 are
// hidden. The total is rendered in the center for quick scanning.
// The legend below the chart is generated automatically from the data.
// =====================================================================

import { cn } from '../../utils/cn';

const SIZE = 160;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DonutChart({
  data = [],
  centerLabel,
  centerValue,
  emptyLabel = 'No data',
  className,
}) {
  const slices = (Array.isArray(data) ? data : []).filter((d) => d.value > 0);
  const total = slices.reduce((sum, d) => sum + d.value, 0);

  if (!slices.length) {
    return (
      <div className={cn('text-xs text-text-muted text-center py-6', className)}>
        {emptyLabel}
      </div>
    );
  }

  let offset = 0;
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={centerLabel || 'Distribution'}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-bg-hover"
          />
          {slices.map((slice) => {
            const fraction = total > 0 ? slice.value / total : 0;
            const dash = fraction * CIRCUMFERENCE;
            const segment = (
              <circle
                key={slice.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return segment;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-semibold text-text">{centerValue ?? total}</div>
          {centerLabel && (
            <div className="text-xs uppercase tracking-wide text-text-muted">{centerLabel}</div>
          )}
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-xs">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-text-secondary">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: slice.color }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate">{slice.label}</span>
            <span className="font-mono tabular-nums text-text">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
