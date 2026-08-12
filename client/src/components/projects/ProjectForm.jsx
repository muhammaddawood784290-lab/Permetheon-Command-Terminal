// =====================================================================
// ProjectForm — create / edit project modal with validation.
// Validation runs before submit so the service layer only ever sees
// well-formed payloads.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import { ROLE } from '../../utils/constants';

const STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

function validate(values) {
  const errors = {};
  if (!values.name || values.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters.';
  }
  if (values.name && values.name.length > 120) {
    errors.name = 'Name must be 120 characters or fewer.';
  }
  if (!values.description || values.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters.';
  }
  if (!values.ownerId) {
    errors.ownerId = 'Owner is required.';
  }
  if (!values.startDate) {
    errors.startDate = 'Start date is required.';
  }
  if (!values.deadline) {
    errors.deadline = 'Deadline is required.';
  }
  if (values.startDate && values.deadline) {
    const start = new Date(values.startDate);
    const end = new Date(values.deadline);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      errors.deadline = 'Deadline must be on or after the start date.';
    }
  }
  if (!values.status) {
    errors.status = 'Status is required.';
  }
  return errors;
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDateInput(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '';
  }
}

const EMPTY_VALUES = {
  name: '',
  description: '',
  ownerId: '',
  leadId: '',
  status: 'PLANNING',
  startDate: '',
  deadline: '',
  tags: '',
};

export default function ProjectForm({
  open,
  mode = 'create',
  initialValues,
  ownerOptions = [],
  leadOptions = [],
  defaultOwnerId,
  onSubmit,
  onClose,
  submitting = false,
}) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubmitAttempted(false);
    setErrors({});
    if (initialValues) {
      setValues({
        name: initialValues.name || '',
        description: initialValues.description || '',
        ownerId: initialValues.ownerId || defaultOwnerId || '',
        leadId: initialValues.leadId || '',
        status: initialValues.status || 'PLANNING',
        startDate: toDateInput(initialValues.startDate),
        deadline: toDateInput(initialValues.deadline),
        tags: Array.isArray(initialValues.tags) ? initialValues.tags.join(', ') : initialValues.tags || '',
      });
    } else {
      setValues({
        ...EMPTY_VALUES,
        startDate: todayIso(),
        ownerId: defaultOwnerId || '',
      });
    }
  }, [open, initialValues, defaultOwnerId]);

  const ownerChoices = useMemo(() => {
    const opts = ownerOptions.map((o) => ({ value: o.id, label: o.name }));
    if (values.ownerId && !opts.some((o) => o.value === values.ownerId)) {
      opts.push({ value: values.ownerId, label: values.ownerId });
    }
    return opts;
  }, [ownerOptions, values.ownerId]);

  const leadChoices = useMemo(() => {
    const opts = [{ value: '', label: '— No lead —' }, ...leadOptions.map((o) => ({ value: o.id, label: o.name }))];
    if (values.leadId && !leadOptions.some((o) => o.id === values.leadId)) {
      opts.push({ value: values.leadId, label: values.leadId });
    }
    return opts;
  }, [leadOptions, values.leadId]);

  const setField = (field) => (e) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    if (submitAttempted) {
      setErrors(validate(next));
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    setSubmitAttempted(true);
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const tags = values.tags
      ? values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    onSubmit({
      ...values,
      name: values.name.trim(),
      description: values.description.trim(),
      tags,
      leadId: values.leadId || null,
    });
  };

  const isEdit = mode === 'edit';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'Create new project'}
      description={
        isEdit
          ? 'Update project details. Changes are saved when you click Update.'
          : 'New projects start in Planning and can be activated once the scope is ready.'
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Update project' : 'Create project'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <Input
          label="Project name"
          placeholder="e.g. Customer Portal v2"
          value={values.name}
          onChange={setField('name')}
          required
          error={errors.name}
          maxLength={120}
        />
        <Textarea
          label="Description"
          placeholder="Describe the goals, scope, and any key context."
          value={values.description}
          onChange={setField('description')}
          required
          error={errors.description}
          rows={3}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Owner"
            value={values.ownerId}
            onChange={setField('ownerId')}
            options={ownerChoices}
            placeholder="Select an owner"
            required
            error={errors.ownerId}
          />
          <Select
            label="Lead"
            value={values.leadId || ''}
            onChange={setField('leadId')}
            options={leadChoices}
          />
          <Select
            label="Status"
            value={values.status}
            onChange={setField('status')}
            options={STATUS_OPTIONS}
            required
            error={errors.status}
            disabled={!isEdit}
          />
          <Input
            label="Tags"
            placeholder="Comma separated, e.g. Frontend, CMS"
            value={values.tags}
            onChange={setField('tags')}
            helperText="Used for quick filtering in the list."
          />
          <Input
            label="Start date"
            type="date"
            value={values.startDate}
            onChange={setField('startDate')}
            required
            error={errors.startDate}
          />
          <Input
            label="Deadline"
            type="date"
            value={values.deadline}
            onChange={setField('deadline')}
            required
            error={errors.deadline}
          />
        </div>
        {!isEdit && (
          <p className="text-xs text-text-muted">
            Only Admins and Team Leads can create projects. Make sure the owner has the right
            permissions before assigning.
          </p>
        )}
      </form>
    </Modal>
  );
}

// Helpers exposed for tests / callers.
export { validate, toDateInput, todayIso };
export const __test = { EMPTY_VALUES, ROLE };