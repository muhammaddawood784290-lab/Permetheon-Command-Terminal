// =====================================================================
// Select — labeled native select with consistent styling.
// =====================================================================

import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Select = forwardRef(function Select(
  {
    label,
    helperText,
    error,
    options = [],
    className,
    selectClassName,
    id,
    required = false,
    placeholder,
    children,
    ...rest
  },
  ref,
) {
  const inputId = id || rest.name || `sel-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
          {label}
          {required && <span className="text-danger-light ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          className={cn(
            'w-full h-9 rounded-md border bg-bg-subtle text-sm text-text',
            'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
            'disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8 pl-3',
            'transition-colors duration-150',
            error ? 'border-danger' : 'border-border hover:border-border-strong',
            selectClassName,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children
            ? children
            : options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error ? (
        <p className="text-xs text-danger-light">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
