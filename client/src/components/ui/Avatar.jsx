// =====================================================================
// Avatar — colored initials avatar. Falls back to "?" when no name.
// =====================================================================

import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/initials';

const SIZES = {
  xs: 'h-6 w-6 text-[0.625rem]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export default function Avatar({ name, user, color, size = 'md', className, status }) {
  const displayName = user?.name || name;
  const bgColor = color || user?.avatarColor;
  const initials = getInitials(displayName);
  const fallbackColor = '#475569';

  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 select-none',
        SIZES[size] || SIZES.md,
        className,
      )}
      style={{
        backgroundColor: bgColor || fallbackColor,
      }}
      aria-label={displayName || 'User'}
    >
      {initials}
      {status && (
        <span
          className={cn(
            'absolute inline-block rounded-full ring-2 ring-bg-surface',
            status === 'online' && 'bg-success-light',
            status === 'offline' && 'bg-text-muted',
            status === 'busy' && 'bg-danger-light',
            size === 'xs' ? 'h-1.5 w-1.5 right-0 bottom-0' : 'h-2 w-2 right-0 bottom-0',
          )}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

export function AvatarStack({ users = [], max = 4, size = 'sm' }) {
  const shown = users.slice(0, max);
  const overflow = users.length - shown.length;
  return (
    <div className="inline-flex items-center -space-x-2">
      {shown.map((u) => (
        <Avatar key={u.id} name={u.name} color={u.avatarColor} size={size} className="ring-2 ring-bg-surface" />
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-bg-elevated text-2xs text-text-secondary ring-2 ring-bg-surface">
          +{overflow}
        </span>
      )}
    </div>
  );
}
