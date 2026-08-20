// =====================================================================
// ProgressBar — inline progress indicator with optional tone.
// =====================================================================

import { cn } from '../../utils/cn';

const TONE_CLASSES = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-info-500',
  neutral: 'bg-text-muted',
};

export default function ProgressBar({
  value,
  tone = 'primary',
  className,
  trackClassName,
  fillClassName,
  showLabel = false,
}) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 h-1.5 rounded-full bg-bg-hover overflow-hidden', trackClassName)}>
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', TONE_CLASSES[tone] || TONE_CLASSES.primary, fillClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono tabular-nums text-text-secondary w-10 text-right">
          {pct}%
        </span>
      )}
    </div>
  );
}
