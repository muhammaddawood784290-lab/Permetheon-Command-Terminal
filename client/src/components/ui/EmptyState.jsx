// =====================================================================
// EmptyState — used by every data-driven screen that has no data yet.
// =====================================================================

import { cn } from '../../utils/cn';

export default function EmptyState({
  title = 'Nothing here yet',
  description,
  icon,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-12 rounded-md border border-dashed border-border bg-bg-surface/40',
        className,
      )}
    >
      {icon && (
        <div className="mb-3 inline-flex items-center justify-center h-12 w-12 rounded-full bg-bg-hover text-text-muted">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="mt-1 text-xs text-text-muted max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
