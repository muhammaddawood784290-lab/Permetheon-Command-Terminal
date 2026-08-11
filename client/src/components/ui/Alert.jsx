// =====================================================================
// Alert — inline notice with title + message.
// =====================================================================

import { cn } from '../../utils/cn';

const VARIANTS = {
  info: 'bg-info-soft border-info/40 text-info-light',
  success: 'bg-success-soft border-success/40 text-success-light',
  warning: 'bg-warning-soft border-warning/40 text-warning-light',
  danger: 'bg-danger-soft border-danger/40 text-danger-light',
  neutral: 'bg-bg-hover border-border text-text-secondary',
};

export default function Alert({
  variant = 'info',
  title,
  children,
  className,
  leftIcon,
  onClose,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-md border px-3 py-2.5',
        VARIANTS[variant] || VARIANTS.info,
        className,
      )}
    >
      {leftIcon && <span className="mt-0.5 inline-flex shrink-0">{leftIcon}</span>}
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-medium">{title}</p>}
        <div className={cn('text-xs', title ? 'mt-1 text-text-secondary' : 'text-text')}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 10-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}
