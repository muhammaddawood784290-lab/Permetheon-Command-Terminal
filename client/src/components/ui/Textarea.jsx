// =====================================================================
// Textarea
// =====================================================================

import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Textarea = forwardRef(function Textarea(
  { label, helperText, error, className, textareaClassName, id, required = false, rows = 4, ...rest },
  ref,
) {
  const inputId = id || rest.name || `ta-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
          {label}
          {required && <span className="text-danger-light ml-1">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        aria-invalid={!!error}
        className={cn(
          'w-full rounded-md border bg-bg-subtle text-sm text-text placeholder:text-text-muted px-3 py-2',
          'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
          'disabled:opacity-50 disabled:cursor-not-allowed resize-y',
          'transition-colors duration-150',
          error ? 'border-danger' : 'border-border hover:border-border-strong',
          textareaClassName,
        )}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-danger-light">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
