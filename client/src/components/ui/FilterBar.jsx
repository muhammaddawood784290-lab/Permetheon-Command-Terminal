// =====================================================================
// FilterBar — simple horizontal filter container for list pages.
// =====================================================================

import { cn } from '../../utils/cn';

export default function FilterBar({ children, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {children}
    </div>
  );
}
