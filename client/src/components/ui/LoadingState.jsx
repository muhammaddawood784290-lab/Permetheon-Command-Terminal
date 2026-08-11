// =====================================================================
// LoadingState — inline block skeleton block for list/detail pages.
// =====================================================================

import Skeleton from './Skeleton';

export default function LoadingState({ rows = 5, height = 'h-10', className }) {
  return (
    <div className={`flex flex-col gap-2 ${className || ''}`} role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`w-full ${height}`} />
      ))}
    </div>
  );
}
