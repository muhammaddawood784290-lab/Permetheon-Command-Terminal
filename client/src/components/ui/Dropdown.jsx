// =====================================================================
// Dropdown — generic dropdown anchored to a trigger element.
//
// The trigger is whatever JSX the caller passes (a <button> or any
// other element). Dropdown wires up open/close + ARIA attributes by
// cloning the trigger element rather than wrapping it in another
// <button>, which prevents nested-interactive-element DOM warnings.
//
// Callers should pass a <button type="button"> as the trigger so the
// final DOM has exactly one focusable interactive element per menu.
// =====================================================================

import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export default function Dropdown({
  trigger,
  children,
  align = 'right',
  className,
  menuClassName,
  closeOnSelect = true,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const alignments = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  // Wrap children to close the dropdown on click if closeOnSelect is true.
  const wrapped =
    typeof children === 'function'
      ? children({ close: () => setOpen(false) })
      : children;

  // Clone the trigger so we can attach onClick + ARIA without rendering
  // a wrapper element. This keeps the DOM tree free of nested buttons.
  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: (e) => {
          // Preserve any existing onClick from the caller.
          if (typeof trigger.props.onClick === 'function') {
            trigger.props.onClick(e);
          }
          setOpen((v) => !v);
        },
        'aria-haspopup': 'menu',
        'aria-expanded': open,
      })
    : trigger;

  // Only the trigger should be rendered when closed.
  if (!open) {
    return (
      <div ref={containerRef} className={cn('relative inline-block', className)}>
        {triggerElement}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      {triggerElement}
      <div
        role="menu"
        className={cn(
          'absolute z-40 mt-1 min-w-[10rem] bg-bg-elevated border border-border rounded-md shadow-lg py-1 animate-fade-slide',
          alignments[align] || alignments.right,
          menuClassName,
        )}
        onClick={() => closeOnSelect && setOpen(false)}
      >
        {wrapped}
      </div>
    </div>
  );
}

export function DropdownItem({ children, onClick, disabled, leftIcon, danger, className }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left',
        'hover:bg-bg-hover focus:bg-bg-hover focus:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        danger ? 'text-danger-light hover:bg-danger-soft' : 'text-text',
        className,
      )}
    >
      {leftIcon && <span className="inline-flex shrink-0 text-text-muted">{leftIcon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 border-t border-border" />;
}

export function DropdownLabel({ children }) {
  return <div className="px-3 py-1.5 text-2xs uppercase tracking-wide text-text-muted">{children}</div>;
}
