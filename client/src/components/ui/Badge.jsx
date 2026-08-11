// =====================================================================
// Badge — small status / priority / role label.
// =====================================================================

import { cn } from '../../utils/cn';

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className,
  leftIcon,
}) {
  const variants = {
    neutral: 'bg-bg-hover text-text-secondary border-border',
    primary: 'bg-primary-500/10 text-primary-300 border-primary-500/40',
    success: 'bg-success-soft text-success-light border-success/40',
    warning: 'bg-warning-soft text-warning-light border-warning/40',
    danger: 'bg-danger-soft text-danger-light border-danger/40',
    info: 'bg-info-soft text-info-light border-info/40',
  };

  const sizes = {
    sm: 'text-2xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border font-medium uppercase tracking-wide whitespace-nowrap',
        variants[variant] || variants.neutral,
        sizes[size] || sizes.md,
        className,
      )}
    >
      {leftIcon && <span className="inline-flex">{leftIcon}</span>}
      {children}
    </span>
  );
}
