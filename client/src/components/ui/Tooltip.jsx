// =====================================================================
// Tooltip — minimal CSS-only tooltip. Anchored to its child element.
// =====================================================================

import { cloneElement, isValidElement } from 'react';
import { cn } from '../../utils/cn';

export default function Tooltip({ children, label, side = 'top', className }) {
  if (!label) return children;
  if (!isValidElement(children)) return children;

  const sideStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-bg-elevated border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-bg-elevated border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-bg-elevated border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-bg-elevated border-l-transparent',
  };

  return cloneElement(children, {
    className: cn('relative inline-flex group', children.props.className),
    children: (
      <>
        {children.props.children}
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-30 px-2 py-1 rounded text-2xs font-medium whitespace-nowrap',
            'bg-bg-elevated text-text border border-border shadow-md',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            sideStyles[side],
            className,
          )}
        >
          {label}
          <span
            className={cn('absolute h-0 w-0 border-[4px]', arrowStyles[side])}
            aria-hidden="true"
          />
        </span>
      </>
    ),
  });
}
