// =====================================================================
// AuthLayout — minimal centered layout for login / session expired pages.
// =====================================================================

import { APP_FULL_NAME } from '../utils/constants';

export default function AuthLayout({ children, subtitle }) {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-md bg-primary-600 flex items-center justify-center mb-3">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h1 className="text-xl font-semibold text-text">PCT</h1>
          <p className="text-sm text-text-muted">{APP_FULL_NAME}</p>
          {subtitle && <p className="text-xs text-text-muted/80 mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
      <p className="mt-6 text-[11px] text-text-muted/70">
        © {new Date().getFullYear()} Permetheon. Internal use only.
      </p>
    </div>
  );
}
