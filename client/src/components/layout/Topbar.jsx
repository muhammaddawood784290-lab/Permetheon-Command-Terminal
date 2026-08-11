// =====================================================================
// Topbar — page-level header with search, notifications, profile menu.
// =====================================================================

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../context/ToastContext';
import { formatRelativeTime } from '../../utils/formatDate';
import { NOTIFICATION_TYPE_ICONS } from '../../utils/constants';
import { cn } from '../../utils/cn';

function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickAway = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md text-text-muted hover:bg-bg-elevated hover:text-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Icon name="bell" size="md" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 text-[10px] font-semibold rounded-full bg-danger text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-bg-surface border border-bg-elevated rounded-md shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-bg-elevated">
            <h3 className="text-sm font-semibold text-text">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-primary-400 hover:text-primary-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-text-muted">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 6).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markAsRead(n.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-bg-elevated/60 hover:bg-bg-elevated transition-colors',
                    !n.read && 'bg-primary-600/5',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-text-muted shrink-0">
                      <Icon name={NOTIFICATION_TYPE_ICONS[n.type] || 'bell'} size="sm" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text truncate">{n.title}</div>
                      {n.message && (
                        <div className="text-xs text-text-muted line-clamp-2 mt-0.5">{n.message}</div>
                      )}
                      <div className="text-[11px] text-text-muted/80 mt-1">
                        {formatRelativeTime(n.createdAt)}
                      </div>
                    </div>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="px-3 py-2 border-t border-bg-elevated">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-primary-400 hover:text-primary-300 py-1"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function GlobalSearch() {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <form onSubmit={submit} className="relative flex-1 max-w-md">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
        <Icon name="search" size="sm" />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search projects, tasks, users…"
        className="w-full pl-9 pr-3 py-1.5 bg-bg-elevated border border-bg-elevated rounded-md text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary-500 focus:bg-bg-surface"
        aria-label="Global search"
      />
    </form>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();

  const handleLogout = async () => {
    await logout();
    push({ type: 'info', message: 'Signed out successfully.' });
    navigate('/login');
  };

  if (!user) return null;

  return (
    <Dropdown
      align="right"
      trigger={
        <button
          type="button"
          className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-bg-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
          aria-label="Profile menu"
        >
          <Avatar user={user} size="sm" />
          <span className="hidden md:block text-sm text-text">{user.name}</span>
          <Icon name="chevronDown" size="xs" className="text-text-muted" />
        </button>
      }
    >
      <div className="px-3 py-2 border-b border-bg-elevated min-w-[180px]">
        <div className="text-sm font-medium text-text">{user.name}</div>
        <div className="text-xs text-text-muted truncate">{user.email}</div>
      </div>
      <DropdownItem onClick={() => navigate('/profile')}>
        <Icon name="users" size="sm" />
        <span>My Profile</span>
      </DropdownItem>
      <DropdownItem onClick={() => navigate('/settings')}>
        <Icon name="settings" size="sm" />
        <span>Settings</span>
      </DropdownItem>
      <DropdownSeparator />
      <DropdownItem onClick={handleLogout} danger>
        <Icon name="logout" size="sm" />
        <span>Sign out</span>
      </DropdownItem>
    </Dropdown>
  );
}

export default function Topbar() {
  const { openMobile } = useSidebar();

  return (
    <header className="h-14 shrink-0 bg-bg-surface border-b border-bg-elevated flex items-center px-3 md:px-5 gap-3 sticky top-0 z-30">
      {/* Mobile menu trigger */}
      <button
        type="button"
        onClick={openMobile}
        className="p-1.5 rounded-md text-text-muted hover:bg-bg-elevated hover:text-text lg:hidden"
        aria-label="Open menu"
      >
        <Icon name="menu" size="md" />
      </button>

      <GlobalSearch />

      <div className="flex items-center gap-1.5 ml-auto">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
