// =====================================================================
// RoleChangeDialog — modal for changing a user's role.
//
// Surfaces the available roles the actor is allowed to assign to the
// target (see userService.rolesAvailableFor). Self-demotion and
// last-admin demotion are disabled inline AND enforced server-side
// by the service, so the dialog stays honest even if the rules change.
// =====================================================================

import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import {
  ROLE,
  ROLE_LABELS,
} from '../../utils/constants';

export default function RoleChangeDialog({
  open,
  user,
  availableRoles,
  isSelf,
  isLastAdmin,
  onClose,
  onConfirm,
}) {
  const [role, setRole] = useState(user?.role || ROLE.DEVELOPER);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRole(user?.role || ROLE.DEVELOPER);
    setSubmitting(false);
  }, [open, user]);

  if (!user) return null;

  const options = (availableRoles || Object.values(ROLE)).map((value) => ({
    value,
    label: ROLE_LABELS[value],
  }));

  let blockedReason = null;
  if (isSelf) blockedReason = 'You cannot change your own role.';
  else if (isLastAdmin) blockedReason = 'Cannot demote the last administrator.';

  const handleSubmit = async () => {
    if (blockedReason || role === user.role) return;
    setSubmitting(true);
    try {
      await onConfirm(role);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change role"
      description="Update the workspace role for this user. The change is audited."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!!blockedReason || role === user.role}
          >
            Save role
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <Avatar user={user} size="md" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-text truncate">{user.name}</div>
          <div className="text-xs text-text-muted truncate">{user.email}</div>
        </div>
      </div>

      {blockedReason && (
        <div className="mb-4 rounded-md border border-warning/40 bg-warning-soft text-warning-light text-xs px-3 py-2 flex items-center gap-2">
          <Icon name="alertTriangle" size="sm" />
          <span>{blockedReason}</span>
        </div>
      )}

      <Select
        label="New role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        options={options}
        disabled={!!blockedReason}
      />

      {user.role === ROLE.ADMIN && role !== ROLE.ADMIN && (
        <p className="mt-3 text-xs text-text-muted">
          {ROLE_LABELS[user.role]}s can manage users, projects, and roles.
          Demoting {user.name} removes those privileges.
        </p>
      )}
    </Modal>
  );
}