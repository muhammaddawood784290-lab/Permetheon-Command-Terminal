// =====================================================================
// Card — basic surface container with header / body / footer slots.
// =====================================================================

import { cn } from '../../utils/cn';

export function Card({ children, className, padding = 'md', ...rest }) {
  const pad = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  return (
    <div
      className={cn(
        'bg-bg-surface border border-border rounded-md shadow-xs',
        pad[padding] || pad.md,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, divider = true }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3',
        divider && 'pb-3 mb-3 border-b border-border',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, subtitle, className }) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <h3 className="text-sm font-semibold text-text">{children}</h3>
      {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
    </div>
  );
}

export function CardBody({ children, className }) {
  return <div className={cn('text-sm text-text-secondary', className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default Card;
