// =====================================================================
// StatusChangeDialog — modal for activating or deactivating a user.
// Self-deactivation and deactivating the last admin are blocked both
// inline and server-side. Suspending is offered as a third status for
// admin-initiated holds.
// =====================================================================

import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { USER_STATUS, USER_STATUS_LABELS } from '../../utils/constants';

const STATUS_OPTIONS = Object.values(USER_STATUS).map((value) => ({
  value,
  label: USER_STATUS_LABELS[value],
}));

export default function StatusChangeDialog({
  open,
  user,
  isSelf,
  isLastAdmin,
  onClose,
  onConfirm,
}) {
  const [status, setStatus] = useState(USER_STATUS.INACTIVE);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    // Default target — if currently active, propose deactivate; otherwise reactivate.
    setStatus(user.status === USER_STATUS.ACTIVE ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE);
    setSubmitting(false);
  }, [open, user]);

  if (!user) return null;

  let blockedReason = null;
  if (isSelf && status !== USER_STATUS.ACTIVE) {
    blockedReason = 'You cannot deactivate your own account.';
  } else if (isLastAdmin && user.status === USER_STATUS.ACTIVE && status !== USER_STATUS.ACTIVE) {
    blockedReason = 'Cannot deactivate the last administrator.';
  }

  const handleSubmit = async () => {
    if (blockedReason || status === user.status) return;
    setSubmitting(true);
    try {
      await onConfirm(status);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change status"
      description="Activating or deactivating a user updates their access immediately."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant={status === USER_STATUS.ACTIVE ? 'primary' : 'danger'}
            onClick={handleSubmit}
            loading={submitting}
            disabled={!!blockedReason || status === user.status}
          >
            {status === USER_STATUS.ACTIVE ? 'Activate' : status === USER_STATUS.SUSPENDED ? 'Suspend' : 'Deactivate'}
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
        label="New status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        options={STATUS_OPTIONS}
        disabled={!!blockedReason}
      />
    </Modal>
  );
}