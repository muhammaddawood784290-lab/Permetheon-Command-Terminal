// =====================================================================
// Toast — global toast container.
// =====================================================================

import { useToast } from '../../context/ToastContext';
import { cn } from '../../utils/cn';

const VARIANTS = {
  info: { bar: 'bg-info-light', soft: 'bg-info-soft border-info/40 text-text' },
  success: { bar: 'bg-success-light', soft: 'bg-success-soft border-success/40 text-text' },
  warning: { bar: 'bg-warning-light', soft: 'bg-warning-soft border-warning/40 text-text' },
  error: { bar: 'bg-danger-light', soft: 'bg-danger-soft border-danger/40 text-text' },
};

const ICONS = {
  info: (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.5a.75.75 0 001.5 0V9a.75.75 0 00-1.5 0v3.5zM10 7a.9.9 0 100-1.8.9.9 0 000 1.8z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.7a1 1 0 00-1.4-1.4l-3.3 3.3-1.3-1.3a1 1 0 10-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.66-1.143 2.37-1.143 3.03 0l6.28 10.875c.66 1.143-.165 2.572-1.515 2.572H3.72c-1.35 0-2.175-1.429-1.515-2.572L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.4-5.4a1 1 0 001.4 0l4-4a1 1 0 10-1.4-1.4L10 9.18 7.4 6.6a1 1 0 10-1.4 1.4l4 4z" clipRule="evenodd" />
    </svg>
  ),
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => {
        const variant = VARIANTS[toast.type] || VARIANTS.info;
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto w-80 max-w-[90vw] flex items-start gap-3 rounded-md border shadow-lg px-3 py-2.5 animate-slide-up',
              variant.soft,
            )}
          >
            <span className="mt-0.5">{ICONS[toast.type] || ICONS.info}</span>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="text-sm font-medium text-text">{toast.title}</p>
              )}
              <p className={cn('text-xs', toast.title ? 'mt-0.5 text-text-secondary' : 'text-text')}>
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="text-text-muted hover:text-text"
              aria-label="Dismiss notification"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 10-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
            <span className={cn('absolute left-0 top-0 bottom-0 w-0.5 rounded-l-md', variant.bar)} />
          </div>
        );
      })}
    </div>
  );
}
