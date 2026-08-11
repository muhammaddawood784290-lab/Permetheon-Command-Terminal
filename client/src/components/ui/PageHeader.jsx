// =====================================================================
// PageHeader — consistent header for each page.
// =====================================================================

import { cn } from '../../utils/cn';

export default function PageHeader({ title, subtitle, actions, breadcrumbs, className }) {
  return (
    <div className={cn('flex flex-col gap-2 pb-4', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="text-xs text-text-muted">
          <ol className="flex items-center gap-1.5 flex-wrap">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${idx}`} className="flex items-center gap-1.5">
                  {idx > 0 && <span className="text-text-muted/60">/</span>}
                  {crumb.to && !isLast ? (
                    <a
                      href={crumb.to}
                      className="hover:text-text-secondary transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className={isLast ? 'text-text-secondary' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
