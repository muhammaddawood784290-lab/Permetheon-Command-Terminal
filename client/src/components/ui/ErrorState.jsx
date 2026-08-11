// =====================================================================
// ErrorState — when data fails to load. Includes a retry callback.
// =====================================================================

import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this data. Please try again.',
  onRetry,
  className,
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-12 rounded-md border border-danger/40 bg-danger-soft/40 ${className || ''}`}>
      <div className="mb-3 inline-flex items-center justify-center h-12 w-12 rounded-full bg-danger-soft text-danger-light">
        <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="mt-1 text-xs text-text-muted max-w-md">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
          Retry
        </Button>
      )}
    </div>
  );
}
