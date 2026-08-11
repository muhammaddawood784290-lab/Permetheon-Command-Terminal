// =====================================================================
// Tabs — accessible tab strip with optional URL sync.
// =====================================================================

import { cn } from '../../utils/cn';

export default function Tabs({
  tabs,
  value,
  onChange,
  variant = 'underline',
  className,
}) {
  const variants = {
    underline: {
      container: 'border-b border-border',
      active: 'border-primary-400 text-text',
      inactive: 'border-transparent text-text-muted hover:text-text-secondary',
    },
    pills: {
      container: 'gap-1',
      active: 'bg-bg-hover text-text',
      inactive: 'text-text-muted hover:text-text-secondary hover:bg-bg-hover',
    },
  };

  const style = variants[variant] || variants.underline;

  return (
    <div
      role="tablist"
      className={cn('flex', style.container, className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(tab.value)}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors duration-150',
              variant === 'underline' && 'border-b-2 -mb-px',
              isActive ? style.active : style.inactive,
              tab.disabled && 'opacity-50 cursor-not-allowed',
            )}
            disabled={tab.disabled}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded text-2xs bg-bg-elevated text-text-secondary">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
