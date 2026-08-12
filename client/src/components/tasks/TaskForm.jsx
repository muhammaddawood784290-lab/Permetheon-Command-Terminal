// =====================================================================
// TaskForm — create / edit task modal with validation.
// Validation runs before submit so the service layer only ever sees
// well-formed payloads. Acceptance criteria are edited as a list with
// one text input per row.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Icon from '../ui/Icon';
import {
  TASK_STATUS_LIST,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LIST,
  TASK_PRIORITY_LABELS,
} from '../../utils/constants';

const STATUS_OPTIONS = TASK_STATUS_LIST.map((s) => ({
  value: s,
  label: TASK_STATUS_LABELS[s] || s,
}));

const PRIORITY_OPTIONS = TASK_PRIORITY_LIST.map((p) => ({
  value: p,
  label: TASK_PRIORITY_LABELS[p] || p,
}));

function validate(values) {
  const errors = {};
  if (!values.title || values.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  }
  if (values.title && values.title.length > 200) {
    errors.title = 'Title must be 200 characters or fewer.';
  }
  if (!values.description || values.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters.';
  }
  if (!values.projectId) {
    errors.projectId = 'Project is required.';
  }
  if (!values.priority) {
    errors.priority = 'Priority is required.';
  }
  if (!values.status) {
    errors.status = 'Status is required.';
  }
  if (
    values.deadline &&
    /^\d{4}-\d{2}-\d{2}$/.test(values.deadline) &&
    Number.isNaN(new Date(values.deadline).getTime())
  ) {
    errors.deadline = 'Deadline is not a valid date.';
  }
  if (values.estimatedHours != null && values.estimatedHours !== '') {
    const n = Number(values.estimatedHours);
    if (Number.isNaN(n) || n < 0) {
      errors.estimatedHours = 'Estimated hours must be a positive number.';
    }
  }
  return errors;
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
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  priority: 'MEDIUM',
  status: 'BACKLOG',
  deadline: '',
  estimatedHours: '',
  tags: '',
  acceptanceCriteria: [],
};

export default function TaskForm({
  open,
  mode = 'create',
  initialValues,
  projectOptions = [],
  assigneeOptions = [],
  defaultAssigneeId,
  defaultProjectId,
  canAssign = true,
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
        title: initialValues.title || '',
        description: initialValues.description || '',
        projectId: initialValues.projectId || '',
        assigneeId: initialValues.assigneeId || defaultAssigneeId || '',
        priority: initialValues.priority || 'MEDIUM',
        status: initialValues.status || 'BACKLOG',
        deadline: toDateInput(initialValues.deadline),
        estimatedHours:
          initialValues.estimatedHours != null ? String(initialValues.estimatedHours) : '',
        tags: Array.isArray(initialValues.tags) ? initialValues.tags.join(', ') : initialValues.tags || '',
        acceptanceCriteria: Array.isArray(initialValues.acceptanceCriteria)
          ? [...initialValues.acceptanceCriteria]
          : [],
      });
    } else {
      setValues({
        ...EMPTY_VALUES,
        projectId: defaultProjectId || '',
        assigneeId: defaultAssigneeId || '',
      });
    }
  }, [open, initialValues, defaultAssigneeId, defaultProjectId]);

  const projectChoices = useMemo(() => {
    const opts = projectOptions.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }));
    if (values.projectId && !opts.some((o) => o.value === values.projectId)) {
      opts.push({ value: values.projectId, label: values.projectId });
    }
    return opts;
  }, [projectOptions, values.projectId]);

  const assigneeChoices = useMemo(() => {
    const opts = [
      { value: '', label: '— Unassigned —' },
      ...assigneeOptions.map((u) => ({ value: u.id, label: u.name })),
    ];
    if (
      values.assigneeId &&
      values.assigneeId !== '' &&
      !assigneeOptions.some((u) => u.id === values.assigneeId)
    ) {
      opts.push({ value: values.assigneeId, label: values.assigneeId });
    }
    return opts;
  }, [assigneeOptions, values.assigneeId]);

  const setField = (field) => (e) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    if (submitAttempted) {
      setErrors(validate(next));
    }
  };

  const updateCriterion = (idx, value) => {
    const next = [...values.acceptanceCriteria];
    next[idx] = value;
    setValues((v) => ({ ...v, acceptanceCriteria: next }));
  };
  const addCriterion = () => {
    setValues((v) => ({
      ...v,
      acceptanceCriteria: [...v.acceptanceCriteria, ''],
    }));
  };
  const removeCriterion = (idx) => {
    setValues((v) => ({
      ...v,
      acceptanceCriteria: v.acceptanceCriteria.filter((_, i) => i !== idx),
    }));
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

    const acceptanceCriteria = values.acceptanceCriteria
      .map((c) => (c || '').trim())
      .filter(Boolean);

    const deadlineIso = values.deadline ? new Date(values.deadline).toISOString() : null;
    const estimatedHours =
      values.estimatedHours === '' ? null : Number(values.estimatedHours);

    onSubmit({
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      tags,
      acceptanceCriteria,
      deadline: deadlineIso,
      estimatedHours,
      assigneeId: values.assigneeId || null,
    });
  };

  const isEdit = mode === 'edit';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'Create new task'}
      description={
        isEdit
          ? 'Update task details. Changes are saved when you click Update.'
          : 'Add a task so the right developer can pick it up.'
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Update task' : 'Create task'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <Input
          label="Title"
          placeholder="e.g. Implement developer login"
          value={values.title}
          onChange={setField('title')}
          required
          error={errors.title}
          maxLength={200}
        />
        <Textarea
          label="Description"
          placeholder="Describe what needs to be done, why, and the expected result."
          value={values.description}
          onChange={setField('description')}
          required
          error={errors.description}
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Project"
            value={values.projectId}
            onChange={setField('projectId')}
            options={projectChoices}
            placeholder="Select a project"
            required
            error={errors.projectId}
          />
          <Select
            label="Assignee"
            value={values.assigneeId || ''}
            onChange={setField('assigneeId')}
            options={assigneeChoices}
            disabled={!canAssign}
            helperText={
              !canAssign
                ? 'Only Admins and Team Leads can reassign tasks.'
                : 'Pick the developer who will own this work.'
            }
          />
          <Select
            label="Status"
            value={values.status}
            onChange={setField('status')}
            options={STATUS_OPTIONS}
            required
            error={errors.status}
          />
          <Select
            label="Priority"
            value={values.priority}
            onChange={setField('priority')}
            options={PRIORITY_OPTIONS}
            required
            error={errors.priority}
          />
          <Input
            label="Deadline"
            type="date"
            value={values.deadline}
            onChange={setField('deadline')}
            error={errors.deadline}
          />
          <Input
            label="Estimated hours"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 6"
            value={values.estimatedHours}
            onChange={setField('estimatedHours')}
            error={errors.estimatedHours}
          />
          <Input
            label="Tags"
            placeholder="Comma separated, e.g. Frontend, CMS"
            value={values.tags}
            onChange={setField('tags')}
            helperText="Used for quick filtering in the list."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Acceptance criteria
            </label>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              leftIcon={<Icon name="plus" size="sm" />}
              onClick={addCriterion}
            >
              Add criterion
            </Button>
          </div>
          {values.acceptanceCriteria.length === 0 ? (
            <p className="text-xs text-text-muted italic">
              No criteria defined. Use the button above to add some.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {values.acceptanceCriteria.map((c, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder={`Criterion ${idx + 1}`}
                    value={c}
                    onChange={(e) => updateCriterion(idx, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Remove criterion ${idx + 1}`}
                    onClick={() => removeCriterion(idx)}
                  >
                    <Icon name="trash" size="sm" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </Modal>
  );
}

// Helpers exposed for tests / callers.
export { validate, toDateInput };
