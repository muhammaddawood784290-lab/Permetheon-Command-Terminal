// =====================================================================
// Spinner
// =====================================================================

import { cn } from '../../utils/cn';

const SIZES = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export default function Spinner({ size = 'md', className, label }) {
  return (
    <span
      role="status"
      aria-label={label || 'Loading'}
      className={cn(
        'inline-block rounded-full animate-spin border-current border-t-transparent text-text-secondary',
        SIZES[size] || SIZES.md,
        className,
      )}
    />
  );
}
