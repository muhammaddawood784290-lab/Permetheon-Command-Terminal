// =====================================================================
// Table — basic table primitives.
// =====================================================================

import { cn } from '../../utils/cn';

export function Table({ children, className }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-sm border-collapse', className)}>{children}</table>
    </div>
  );
}

export function THead({ children, className }) {
  return (
    <thead
      className={cn(
        'bg-bg-subtle border-b border-border text-text-secondary text-xs uppercase tracking-wide',
        className,
      )}
    >
      {children}
    </thead>
  );
}

export function TBody({ children, className }) {
  return <tbody className={cn('divide-y divide-border-subtle', className)}>{children}</tbody>;
}

export function TR({ children, className, ...rest }) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-bg-hover focus-within:bg-bg-hover',
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TH({ children, className, align = 'left' }) {
  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-2 font-medium',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TD({ children, className, align = 'left', colSpan, ...rest }) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'px-3 py-2 text-text',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

export function TEmpty({ children, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-10 text-center text-text-muted">
        {children}
      </td>
    </tr>
  );
}
