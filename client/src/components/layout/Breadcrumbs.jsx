// =====================================================================
// Breadcrumbs — small component for nested page headers.
// =====================================================================

import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { cn } from '../../utils/cn';

export default function Breadcrumbs({ items = [], className }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('text-xs text-text-muted', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((crumb, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${crumb.label}-${idx}`} className="flex items-center gap-1.5">
              {idx > 0 && <Icon name="chevronRight" size="xs" className="text-text-muted/60" />}
              {crumb.to && !isLast ? (
                <Link
                  to={crumb.to}
                  className="hover:text-text-secondary transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={cn(isLast && 'text-text-secondary')}>
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
