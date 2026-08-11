// =====================================================================
// ProgressBar — linear progress bar (0..100).
// =====================================================================

import { cn } from '../../utils/cn';

export default function ProgressBar({ value = 0, max = 100, className, tone = 'primary', showLabel = false, size = 'md' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const tones = {
    primary: 'bg-primary-500',
    success: 'bg-success-light',
    warning: 'bg-warning-light',
    danger: 'bg-danger-light',
  };
  const sizes = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2.5',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full rounded-full bg-bg-hover overflow-hidden', sizes[size] || sizes.md)}>
        <div
          className={cn('h-full transition-all duration-300', tones[tone] || tones.primary)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-2xs text-text-muted text-right">{Math.round(pct)}%</p>
      )}
    </div>
  );
}
