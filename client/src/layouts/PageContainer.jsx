// =====================================================================
// PageContainer — consistent page wrapper with optional header + actions.
// =====================================================================

import { cn } from '../utils/cn';
import PageHeader from '../components/ui/PageHeader';
import Breadcrumbs from '../components/layout/Breadcrumbs';

export default function PageContainer({
  title,
  subtitle,
  actions,
  breadcrumbs,
  children,
  className,
  contentClassName,
}) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {(title || breadcrumbs || actions) && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={actions}
          breadcrumbs={breadcrumbs}
        />
      )}
      <div className={cn('flex-1', contentClassName)}>{children}</div>
    </div>
  );
}
