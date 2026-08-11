// =====================================================================
// Checkbox
// =====================================================================

import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Checkbox = forwardRef(function Checkbox(
  { label, children, helperText, error, className, id, indeterminate = false, ...rest },
  ref,
) {
  const inputId = id || rest.name || `cb-${Math.random().toString(36).slice(2, 8)}`;
  // `children` is treated as the label so call sites can use
  // <Checkbox>Label text</Checkbox>. `label` prop still works too.
  const labelText = label ?? children;
  // Strip any `children` that snuck in through `...rest` so it can't be
  // forwarded onto the void <input> element below.
  const { children: _children, ...inputProps } = rest;

  return (
    <div className={cn('flex items-start gap-2', className)}>
      <input
        id={inputId}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        type="checkbox"
        className={cn(
          'h-4 w-4 mt-0.5 rounded border-border bg-bg-subtle text-primary-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-bg',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        {...inputProps}
      />
      {(labelText || helperText) && (
        <div className="flex flex-col gap-0.5">
          {labelText && (
            <label htmlFor={inputId} className="text-sm text-text cursor-pointer select-none">
              {labelText}
            </label>
          )}
          {helperText && <p className="text-xs text-text-muted">{helperText}</p>}
          {error && <p className="text-xs text-danger-light">{error}</p>}
        </div>
      )}
    </div>
  );
});

export default Checkbox;
