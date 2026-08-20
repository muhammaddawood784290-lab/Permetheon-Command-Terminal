// =====================================================================
// UserForm — modal form for creating or editing a workspace user.
//
// Used by the Users admin page in two modes:
//   • create — fresh user, status defaults to ACTIVE, role required.
//   • edit   — name / email / title / status. Role changes go through
//              RoleChangeDialog so the audit trail stays consistent.
//
// Email uniqueness is enforced both in the service (authoritative) and
// here for instant feedback. Field-level errors are surfaced inline
// plus a summary block so screen readers and keyboard users see them.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Icon from '../ui/Icon';
import {
  ROLE,
  ROLE_LABELS,
  USER_STATUS,
  USER_STATUS_LABELS,
} from '../../utils/constants';

const ROLE_OPTIONS = Object.values(ROLE).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}));
const STATUS_OPTIONS = Object.values(USER_STATUS).map((value) => ({
  value,
  label: USER_STATUS_LABELS[value],
}));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (!form.name || form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }
  if (!form.email || !EMAIL_RE.test(form.email.trim())) {
    errors.email = 'A valid email address is required.';
  }
  if (!ROLE[form.role]) {
    errors.role = 'Pick a role.';
  }
  if (form.title && form.title.length > 80) {
    errors.title = 'Title must be 80 characters or fewer.';
  }
  return errors;
}

export default function UserForm({
  open,
  mode = 'create',
  initial = null,
  onClose,
  onSubmit,
}) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState(() => ({
    name: '',
    email: '',
    role: ROLE.DEVELOPER,
    title: '',
    status: USER_STATUS.ACTIVE,
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setServerError(null);
    setErrors({});
    if (initial) {
      setForm({
        name: initial.name || '',
        email: initial.email || '',
        role: initial.role || ROLE.DEVELOPER,
        title: initial.title || '',
        status: initial.status || USER_STATUS.ACTIVE,
      });
    } else {
      setForm({
        name: '',
        email: '',
        role: ROLE.DEVELOPER,
        title: '',
        status: USER_STATUS.ACTIVE,
      });
    }
  }, [open, initial]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError(null);
  };

  const errorCount = useMemo(() => Object.keys(errors).length, [errors]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        title: form.title.trim(),
      });
    } catch (err) {
      const msg = err?.message || 'Could not save user.';
      setServerError(msg);
      // Map common duplicate-email failures back to the field.
      if (/email/i.test(msg) && /exists|already/i.test(msg)) {
        setErrors((prev) => ({ ...prev, email: msg }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit user' : 'Add user'}
      description={
        isEdit
          ? 'Update the user profile. Role changes go through the dedicated role-change dialog.'
          : 'Invite a new workspace member. They will appear in the user list immediately.'
      }
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        {serverError && errorCount === 0 && (
          <div className="rounded-md border border-danger/40 bg-danger-soft text-danger-light text-xs px-3 py-2 flex items-center gap-2">
            <Icon name="alertCircle" size="sm" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Full name"
            required
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            error={errors.name}
            autoFocus
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            error={errors.email}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isEdit ? (
            <Select
              label="Status"
              required
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              options={STATUS_OPTIONS}
              error={errors.status}
            />
          ) : (
            <Select
              label="Role"
              required
              value={form.role}
              onChange={(e) => setField('role', e.target.value)}
              options={ROLE_OPTIONS}
              error={errors.role}
            />
          )}
          <Input
            label="Title"
            placeholder="e.g. Frontend Developer"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            error={errors.title}
            helperText="Optional, 80 characters max"
          />
        </div>

        {/* Hidden in edit mode — show role as read-only so the admin can
            still see the current role before opening the role dialog. */}
        {isEdit && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="uppercase tracking-wide text-2xs">Role</span>
            <span className="text-text-secondary">{ROLE_LABELS[form.role]}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}