// =====================================================================
// Pagination — used together with usePagination.
// =====================================================================

import { cn } from '../../utils/cn';
import { PAGE_SIZE_OPTIONS } from '../../utils/constants';
import Button from './Button';

export default function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  className,
}) {
  const pages = buildPageWindow(page, totalPages);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3', className)}>
      <p className="text-xs text-text-muted">
        Showing <span className="text-text-secondary">{from}</span>–
        <span className="text-text-secondary">{to}</span> of{' '}
        <span className="text-text-secondary">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-8 text-xs rounded border border-border bg-bg-subtle text-text px-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-1">
          <Button
            size="xs"
            variant="ghost"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-text-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  'h-7 min-w-[1.75rem] px-2 rounded text-xs font-medium',
                  p === page
                    ? 'bg-primary-500 text-white'
                    : 'text-text-secondary hover:bg-bg-hover',
                )}
              >
                {p}
              </button>
            ),
          )}
          <Button
            size="xs"
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function buildPageWindow(page, totalPages) {
  const window = [];
  const radius = 1;
  const start = Math.max(2, page - radius);
  const end = Math.min(totalPages - 1, page + radius);

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) window.push(i);
    return window;
  }

  window.push(1);
  if (start > 2) window.push('...');
  for (let i = start; i <= end; i++) window.push(i);
  if (end < totalPages - 1) window.push('...');
  window.push(totalPages);
  return window;
}
