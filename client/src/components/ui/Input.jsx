// =====================================================================
// Input — labeled text input with error state and helper text.
// =====================================================================

import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    className,
    inputClassName,
    id,
    type = 'text',
    required = false,
    ...rest
  },
  ref,
) {
  const inputId = id || rest.name || `input-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-text-secondary"
        >
          {label}
          {required && <span className="text-danger-light ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined}
          className={cn(
            'w-full h-9 rounded-md border bg-bg-subtle text-sm text-text placeholder:text-text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-150',
            leftIcon ? 'pl-9' : 'pl-3',
            rightIcon ? 'pr-9' : 'pr-3',
            error ? 'border-danger' : 'border-border hover:border-border-strong',
            inputClassName,
          )}
          {...rest}
        />
        {rightIcon && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
            {rightIcon}
          </span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger-light">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-help`} className="text-xs text-text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
