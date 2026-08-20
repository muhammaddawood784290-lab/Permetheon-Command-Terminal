// =====================================================================
// UserTable — desktop table for the Users admin page.
//
// Renders the user list as rows with avatar/name, role badge, status
// badge, last-login relative time, and a per-row action menu. The
// menu is permission-aware: items the actor can't perform (or that
// would violate self-protection / last-admin rules) are disabled with
// an explanatory tooltip-style note rather than hidden, so admins can
// see why the action isn't available.
// =====================================================================

import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { RoleBadge, UserStatusBadge } from '../ui/StatusBadge';
import { formatRelativeTime } from '../../utils/formatDate';
import { ROLE, USER_STATUS } from '../../utils/constants';

function SortIndicator({ field, sort, order }) {
  if (sort !== field) return null;
  return (
    <Icon
      name={order === 'asc' ? 'arrowUp' : 'arrowDown'}
      size="xs"
      className="inline-block ml-1 text-text-muted"
    />
  );
}

export default function UserTable({
  rows,
  loading,
  sort,
  order,
  onSortChange,
  currentUserId,
  canManage,
  lastAdminId,
  onEdit,
  onChangeRole,
  onChangeStatus,
  onViewActivity,
}) {
  const sortableHeader = (field, label, extraClass = '') => (
    <button
      type="button"
      onClick={() => onSortChange(field)}
      className={`inline-flex items-center text-2xs uppercase tracking-wide text-text-muted hover:text-text-secondary ${extraClass}`}
    >
      {label}
      <SortIndicator field={field} sort={sort} order={order} />
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left">
          <tr>
            <th className="py-2.5 px-3">{sortableHeader('name', 'User')}</th>
            <th className="py-2.5 px-3">{sortableHeader('role', 'Role')}</th>
            <th className="py-2.5 px-3">{sortableHeader('status', 'Status')}</th>
            <th className="py-2.5 px-3 hidden md:table-cell">{sortableHeader('lastLoginAt', 'Last login')}</th>
            <th className="py-2.5 px-3 hidden lg:table-cell">{sortableHeader('createdAt', 'Created')}</th>
            <th className="py-2.5 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={`sk-${i}`}>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-bg-hover animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 bg-bg-hover rounded animate-pulse" />
                      <div className="h-2.5 w-40 bg-bg-hover rounded animate-pulse" />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3"><div className="h-5 w-16 bg-bg-hover rounded animate-pulse" /></td>
                <td className="py-3 px-3"><div className="h-5 w-16 bg-bg-hover rounded animate-pulse" /></td>
                <td className="py-3 px-3 hidden md:table-cell"><div className="h-4 w-24 bg-bg-hover rounded animate-pulse" /></td>
                <td className="py-3 px-3 hidden lg:table-cell"><div className="h-4 w-20 bg-bg-hover rounded animate-pulse" /></td>
                <td className="py-3 px-3 text-right"><div className="h-6 w-6 bg-bg-hover rounded animate-pulse inline-block" /></td>
              </tr>
            ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-sm text-text-muted">
                No users match the current filters.
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((user) => {
              const isSelf = user.id === currentUserId;
              const isLastAdmin =
                user.role === ROLE.ADMIN && user.id === lastAdminId;

              const disableRoleChange =
                !canManage || isSelf || isLastAdmin;
              const roleNote = !canManage
                ? 'Only admins can change roles.'
                : isSelf
                ? 'You cannot change your own role.'
                : isLastAdmin
                ? 'Cannot demote the last admin.'
                : '';

              const disableDeactivate =
                !canManage ||
                isSelf ||
                (isLastAdmin && user.status === USER_STATUS.ACTIVE);
              const statusNote = !canManage
                ? 'Only admins can change status.'
                : isSelf
                ? 'You cannot deactivate your own account.'
                : isLastAdmin
                ? 'Cannot deactivate the last admin.'
                : '';

              return (
                <tr key={user.id} className="hover:bg-bg-hover/40">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={user} size="md" />
                      <div className="min-w-0">
                        <div className="font-medium text-text truncate flex items-center gap-2">
                          {user.name}
                          {isSelf && (
                            <span className="text-2xs uppercase tracking-wide text-text-muted">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted truncate">{user.email}</div>
                        {user.title && (
                          <div className="text-xs text-text-muted truncate">{user.title}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <RoleBadge role={user.role} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    <UserStatusBadge status={user.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 hidden md:table-cell text-xs text-text-muted">
                    {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}
                  </td>
                  <td className="py-2.5 px-3 hidden lg:table-cell text-xs text-text-muted">
                    {formatRelativeTime(user.createdAt)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Dropdown
                      align="right"
                      trigger={
                        <button
                          type="button"
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-text-muted hover:bg-bg-elevated hover:text-text"
                          aria-label={`Actions for ${user.name}`}
                        >
                          <Icon name="moreVertical" size="sm" />
                        </button>
                      }
                    >
                      <DropdownItem
                        leftIcon={<Icon name="edit" size="sm" />}
                        onClick={() => onEdit(user)}
                        disabled={!canManage}
                      >
                        Edit profile
                      </DropdownItem>
                      <DropdownItem
                        leftIcon={<Icon name="shield" size="sm" />}
                        onClick={() => onChangeRole(user)}
                        disabled={disableRoleChange}
                        title={roleNote || undefined}
                      >
                        Change role
                      </DropdownItem>
                      {user.status === USER_STATUS.ACTIVE ? (
                        <DropdownItem
                          leftIcon={<Icon name="userX" size="sm" />}
                          danger
                          onClick={() => onChangeStatus(user, USER_STATUS.INACTIVE)}
                          disabled={disableDeactivate}
                          title={statusNote || undefined}
                        >
                          Deactivate
                        </DropdownItem>
                      ) : (
                        <DropdownItem
                          leftIcon={<Icon name="userCheck" size="sm" />}
                          onClick={() => onChangeStatus(user, USER_STATUS.ACTIVE)}
                          disabled={!canManage || isLastAdmin}
                          title={
                            isLastAdmin
                              ? 'Cannot deactivate the last admin.'
                              : !canManage
                              ? 'Only admins can change status.'
                              : undefined
                          }
                        >
                          Activate
                        </DropdownItem>
                      )}
                      <DropdownSeparator />
                      <DropdownItem
                        leftIcon={<Icon name="activity" size="sm" />}
                        onClick={() => onViewActivity(user)}
                      >
                        View activity
                      </DropdownItem>
                    </Dropdown>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}