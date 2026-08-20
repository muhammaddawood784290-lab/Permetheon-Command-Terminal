// =====================================================================
// LineChart — sparkline-style line + area chart for the completion
// trend. Pure SVG, no axis labels (kept short on purpose). The data
// shape is { date: ISO, count: number }. The y-axis is auto-scaled.
// =====================================================================

import { cn } from '../../utils/cn';

const WIDTH = 320;
const HEIGHT = 80;
const PAD_X = 6;
const PAD_Y = 8;

export default function LineChart({
  points = [],
  emptyLabel = 'No completions yet',
  className,
}) {
  const safePoints = Array.isArray(points) ? points : [];
  const hasData = safePoints.some((p) => p.count > 0);

  if (!hasData) {
    return (
      <div className={cn('text-xs text-text-muted text-center py-6', className)}>
        {emptyLabel}
      </div>
    );
  }

  const max = safePoints.reduce((acc, p) => (p.count > acc ? p.count : acc), 0) || 1;
  const stepX = safePoints.length > 1
    ? (WIDTH - PAD_X * 2) / (safePoints.length - 1)
    : 0;

  const coords = safePoints.map((point, idx) => {
    const x = PAD_X + idx * stepX;
    const ratio = point.count / max;
    const y = HEIGHT - PAD_Y - ratio * (HEIGHT - PAD_Y * 2);
    return { x, y, count: point.count, date: point.date };
  });

  const linePath = coords
    .map((c, idx) => (idx === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`))
    .join(' ');

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${HEIGHT - PAD_Y} L ${coords[0].x} ${HEIGHT - PAD_Y} Z`;

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label="Completion trend"
      >
        <path d={areaPath} fill="currentColor" className="text-primary-500/15" />
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary-400"
        />
        {coords.map((c) => (
          <circle
            key={`${c.date}-${c.count}`}
            cx={c.x}
            cy={c.y}
            r={2}
            className="fill-primary-400"
          />
        ))}
      </svg>
      <div className="flex justify-between text-2xs text-text-muted mt-1">
        <span>{safePoints[0]?.date}</span>
        <span>{safePoints[safePoints.length - 1]?.date}</span>
      </div>
    </div>
  );
}
