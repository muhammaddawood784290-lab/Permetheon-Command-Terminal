// =====================================================================
// UserCard — mobile / narrow-viewport rendering of a user row.
// Shows the same actions as UserTable, but stacked vertically. The
// desktop table component is hidden under `lg` and this card list is
// hidden at `lg+` so the layout adapts cleanly.
// =====================================================================

import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import Dropdown, { DropdownItem, DropdownSeparator } from '../ui/Dropdown';
import { RoleBadge, UserStatusBadge } from '../ui/StatusBadge';
import { formatRelativeTime } from '../../utils/formatDate';
import { USER_STATUS } from '../../utils/constants';

export default function UserCard({
  user,
  isSelf,
  isLastAdmin,
  canManage,
  onEdit,
  onChangeRole,
  onChangeStatus,
  onViewActivity,
}) {
  const disableRole = !canManage || isSelf || isLastAdmin;
  const disableDeactivate =
    !canManage ||
    isSelf ||
    (isLastAdmin && user.status === USER_STATUS.ACTIVE);
  const disableActivate = !canManage || isLastAdmin;

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex items-start gap-3">
        <Avatar user={user} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text truncate">{user.name}</h3>
            {isSelf && (
              <span className="text-2xs uppercase tracking-wide text-text-muted">You</span>
            )}
            <RoleBadge role={user.role} size="sm" />
            <UserStatusBadge status={user.status} size="sm" />
          </div>
          <div className="text-xs text-text-muted truncate">{user.email}</div>
          {user.title && (
            <div className="text-xs text-text-muted truncate mt-0.5">{user.title}</div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2 text-2xs uppercase tracking-wide text-text-muted">
            <div>
              <div>Last login</div>
              <div className="text-text-secondary normal-case tracking-normal">
                {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}
              </div>
            </div>
            <div>
              <div>Joined</div>
              <div className="text-text-secondary normal-case tracking-normal">
                {formatRelativeTime(user.createdAt)}
              </div>
            </div>
            <div>
              <div>Open tasks</div>
              <div className="text-text-secondary normal-case tracking-normal">
                {user.openTasks ?? 0}
              </div>
            </div>
            <div>
              <div>Total tasks</div>
              <div className="text-text-secondary normal-case tracking-normal">
                {user.taskCount ?? 0}
              </div>
            </div>
          </div>
        </div>

        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-muted hover:bg-bg-elevated hover:text-text"
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
            disabled={disableRole}
          >
            Change role
          </DropdownItem>
          {user.status === USER_STATUS.ACTIVE ? (
            <DropdownItem
              leftIcon={<Icon name="userX" size="sm" />}
              danger
              onClick={() => onChangeStatus(user, USER_STATUS.INACTIVE)}
              disabled={disableDeactivate}
            >
              Deactivate
            </DropdownItem>
          ) : (
            <DropdownItem
              leftIcon={<Icon name="userCheck" size="sm" />}
              onClick={() => onChangeStatus(user, USER_STATUS.ACTIVE)}
              disabled={disableActivate}
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
      </div>

      {canManage && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Icon name="edit" size="sm" />}
            onClick={() => onEdit(user)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Icon name="shield" size="sm" />}
            onClick={() => onChangeRole(user)}
            disabled={disableRole}
          >
            Role
          </Button>
        </div>
      )}
    </div>
  );
}