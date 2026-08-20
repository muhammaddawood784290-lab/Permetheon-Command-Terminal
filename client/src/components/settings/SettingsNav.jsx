// =====================================================================
// SettingsNav — vertical sub-navigation for the Settings page.
// Mirrors the Permissions sidebar pattern: filters items by the active
// role so non-admins never see the System entry.
// =====================================================================

import Icon from '../ui/Icon';
import { cn } from '../../utils/cn';
import { hasPermission, isAdmin } from '../../utils/permissions';

export default function SettingsNav({ sections, active, onChange }) {
  return (
    <nav aria-label="Settings sections" className="flex flex-col gap-1">
      {sections.map((section) => {
        if (section.requiresAdmin && !isAdmin(section.viewer)) return null;
        const isActive = section.id === active;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
              isActive
                ? 'bg-primary-600/15 text-text'
                : 'text-text-muted hover:bg-bg-elevated hover:text-text',
            )}
          >
            <Icon name={section.icon} size="sm" className="shrink-0" />
            <span className="truncate">{section.label}</span>
            {!hasPermission(section.viewer, 'settings.update') && section.id !== 'system' && (
              <span className="ml-auto text-2xs uppercase tracking-wide text-text-muted/70">
                Read-only
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}