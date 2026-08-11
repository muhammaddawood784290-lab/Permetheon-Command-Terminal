// =====================================================================
// Sidebar — primary navigation. Two visual states:
//   • Desktop collapsed/expanded (icon-only vs icon + label)
//   • Mobile drawer overlay
// Uses NavLink for active-state styling and respects permissions.
// =====================================================================

import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import Tooltip from '../ui/Tooltip';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  {
    section: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', permission: 'project.view' },
      { to: '/projects', label: 'Projects', icon: 'folder', permission: 'project.view' },
      { to: '/tasks', label: 'Tasks', icon: 'checkSquare', permission: 'task.view' },
      { to: '/reviews', label: 'Reviews', icon: 'review', permission: 'review.view' },
      { to: '/notifications', label: 'Notifications', icon: 'bell' },
    ],
  },
  {
    section: 'Insights',
    items: [
      { to: '/activity', label: 'Activity', icon: 'activity', permission: 'activity.view' },
      { to: '/reports', label: 'Reports', icon: 'chart', permission: 'report.view' },
    ],
  },
  {
    section: 'Administration',
    items: [
      { to: '/users', label: 'Users', icon: 'users', permission: 'user.view' },
      { to: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

function SidebarItem({ item, collapsed, onNavigate }) {
  const { user } = useAuth();
  if (item.permission && !hasPermission(user, item.permission)) return null;

  const linkContent = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
          isActive
            ? 'bg-primary-600/15 text-text'
            : 'text-text-muted hover:bg-bg-elevated hover:text-text',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary-500 rounded-r" />
          )}
          <Icon name={item.icon} size="sm" className="shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <li>
        <Tooltip label={item.label} side="right">
          {linkContent}
        </Tooltip>
      </li>
    );
  }

  return <li>{linkContent}</li>;
}

export default function Sidebar() {
  const { collapsed, mobileOpen, closeMobile, toggle } = useSidebar();
  const { user } = useAuth();

  const widthClass = collapsed ? 'lg:w-16' : 'lg:w-60';
  const labelClass = collapsed ? 'lg:hidden' : '';

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={closeMobile}
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 bg-bg-surface border-r border-bg-elevated',
          'flex flex-col w-60 transition-all duration-200 ease-in-out',
          'lg:translate-x-0 lg:relative lg:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          widthClass,
        )}
        aria-label="Primary navigation"
      >
        {/* Brand */}
        <div
          className={cn(
            'flex items-center gap-3 h-14 px-4 border-b border-bg-elevated shrink-0',
            collapsed && 'lg:justify-center lg:px-2',
          )}
        >
          <div className="h-8 w-8 rounded-md bg-primary-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div className={cn('min-w-0', labelClass)}>
            <div className="text-sm font-semibold text-text leading-none">PCT</div>
            <div className="text-[10px] text-text-muted mt-0.5">Command Terminal</div>
          </div>
          <button
            type="button"
            onClick={closeMobile}
            className="ml-auto p-1 rounded text-text-muted hover:bg-bg-elevated lg:hidden"
            aria-label="Close menu"
          >
            <Icon name="x" size="sm" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {NAV_ITEMS.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permission || hasPermission(user, item.permission),
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.section} className="mb-5">
                {!collapsed && (
                  <div className="px-3 mb-1.5 text-[10px] uppercase tracking-wider text-text-muted/70 font-semibold">
                    {section.section}
                  </div>
                )}
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <SidebarItem
                      key={item.to}
                      item={item}
                      collapsed={collapsed}
                      onNavigate={closeMobile}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block p-2 border-t border-bg-elevated shrink-0">
          <button
            type="button"
            onClick={toggle}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-text-muted hover:bg-bg-elevated hover:text-text transition-colors',
              collapsed && 'justify-center',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size="sm" />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
