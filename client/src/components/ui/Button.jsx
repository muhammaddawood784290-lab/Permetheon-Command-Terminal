// =====================================================================
// Button — primary, secondary, ghost, danger variants.
// Supports loading + icon + iconRight + size + disabled.
// =====================================================================

import { cn } from '../../utils/cn';
import Spinner from './Spinner';

const VARIANTS = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-400 active:bg-primary-700',
  secondary:
    'bg-bg-elevated text-text border border-border hover:bg-bg-hover focus-visible:ring-border-strong',
  ghost:
    'bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text focus-visible:ring-border-strong',
  danger:
    'bg-danger text-white hover:bg-red-700 focus-visible:ring-red-400 active:bg-red-800',
  outline:
    'bg-transparent text-primary-300 border border-primary-500/40 hover:bg-primary-500/10 focus-visible:ring-primary-400',
};

const SIZES = {
  xs: 'h-7 px-2 text-xs',
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
};

export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  type = 'button',
  fullWidth = false,
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.secondary,
        SIZES[size] || SIZES.md,
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children && <span className="whitespace-nowrap">{children}</span>}
      {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
}
