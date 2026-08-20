// =====================================================================
// ReviewForm — modal for creating a new review tied to an existing task.
// Mirrors TaskForm.jsx (Modal + Select + Textarea + Button). Validation
// runs before the parent service call is invoked so the service layer
// only ever sees well-formed payloads. Per REVIEW_SYSTEM.md §18 the
// reviewer cannot be the task assignee; per §47 we surface that as a
// client-side guard before submission.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import { TaskStatusBadge, TaskPriorityBadge } from '../ui/StatusBadge';
import {
  TASK_STATUS_LABELS,
  ROLE_LABELS,
} from '../../utils/constants';

function validate({ taskId, reviewerId, note }, taskOptions) {
  const errors = {};
  if (!taskId) {
    errors.taskId = 'Pick a task to review.';
  }
  if (!reviewerId) {
    errors.reviewerId = 'Pick a reviewer.';
  } else if (taskId) {
    const task = taskOptions.find((t) => t.value === taskId)?.task;
    if (task && task.assigneeId && reviewerId === task.assigneeId) {
      errors.reviewerId = 'Reviewer cannot be the task assignee.';
    }
  }
  if (note && note.length > 500) {
    errors.note = 'Note must be 500 characters or fewer.';
  }
  return errors;
}

const EMPTY_VALUES = {
  taskId: '',
  reviewerId: '',
  note: '',
};

export default function ReviewForm({
  open,
  onClose,
  onSubmit,
  taskOptions = [],
  reviewerOptions = [],
  submitting = false,
}) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(EMPTY_VALUES);
    setErrors({});
    setSubmitAttempted(false);
  }, [open]);

  const selectedTask = useMemo(
    () => taskOptions.find((t) => t.value === values.taskId)?.task || null,
    [taskOptions, values.taskId],
  );

  // Self-approval guard (§18): hide the task's assignee from the reviewer
  // dropdown so it cannot be picked accidentally once a task is chosen.
  const reviewerChoices = useMemo(() => {
    const opts = reviewerOptions.map((u) => ({ value: u.id, label: u.name }));
    const blockedId = selectedTask?.assigneeId;
    if (!blockedId) {
      return [{ value: '', label: '— Select reviewer —' }, ...opts];
    }
    return [
      { value: '', label: '— Select reviewer —' },
      ...opts.filter((o) => o.value !== blockedId),
    ];
  }, [reviewerOptions, selectedTask]);

  const taskChoices = useMemo(() => {
    const opts = taskOptions.map((t) => ({ value: t.value, label: t.label }));
    return [{ value: '', label: '— Select task —', disabled: true }, ...opts];
  }, [taskOptions]);

  const setField = (field) => (e) => {
    const next = { ...values, [field]: e.target.value };
    // When switching tasks, clear any stale reviewer so the new task's
    // assignee guard re-runs against the right person.
    if (field === 'taskId' && next.taskId !== values.taskId) {
      next.reviewerId = '';
    }
    setValues(next);
    if (submitAttempted) {
      setErrors(validate(next, taskOptions));
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    setSubmitAttempted(true);
    const nextErrors = validate(values, taskOptions);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({
      taskId: values.taskId,
      reviewerId: values.reviewerId,
      note: values.note.trim(),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add review"
      description="Submit a task for review. The task moves to In Review and the review is created in Submitted state."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting || taskOptions.length === 0}
          >
            Submit for review
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <Select
          label="Task"
          value={values.taskId}
          onChange={setField('taskId')}
          options={taskChoices}
          required
          error={errors.taskId}
          helperText={
            taskOptions.length === 0
              ? 'No in-progress, unassigned-to-review tasks available right now.'
              : 'Only tasks currently In Progress appear here.'
          }
        />

        {selectedTask && (
          <div className="rounded-md border border-border bg-bg-subtle px-3 py-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <TaskStatusBadge status={selectedTask.status} size="sm" />
                <TaskPriorityBadge priority={selectedTask.priority} size="sm" />
              </div>
              <span className="text-xs text-text-muted">
                {selectedTask.code || selectedTask.id}
              </span>
            </div>
            <p className="text-sm text-text font-medium leading-snug">
              {selectedTask.title}
            </p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {selectedTask.projectName && (
                <>
                  <dt className="text-text-muted">Project</dt>
                  <dd className="text-text">{selectedTask.projectName}</dd>
                </>
              )}
              {selectedTask.assigneeName && (
                <>
                  <dt className="text-text-muted">Assignee</dt>
                  <dd className="text-text">
                    {selectedTask.assigneeName}
                    {selectedTask.assigneeRole && (
                      <span className="text-text-muted">
                        {' '}
                        · {ROLE_LABELS[selectedTask.assigneeRole] || selectedTask.assigneeRole}
                      </span>
                    )}
                  </dd>
                </>
              )}
              {selectedTask.deadline && (
                <>
                  <dt className="text-text-muted">Deadline</dt>
                  <dd className="text-text">
                    {new Date(selectedTask.deadline).toLocaleDateString()}
                  </dd>
                </>
              )}
            </dl>
          </div>
        )}

        <Select
          label="Reviewer"
          value={values.reviewerId}
          onChange={setField('reviewerId')}
          options={reviewerChoices}
          required
          error={errors.reviewerId}
          helperText={
            selectedTask
              ? 'Admins and Team Leads can review. The task assignee is excluded.'
              : 'Pick a task first to enable reviewer selection.'
          }
          disabled={!selectedTask}
        />

        <Textarea
          label="Note (optional)"
          placeholder="e.g. Initial submission — please verify the responsive layout on tablet."
          value={values.note}
          onChange={setField('note')}
          rows={3}
          error={errors.note}
          maxLength={500}
          helperText={`${values.note.length}/500 — appears as the first feedback item on the review.`}
        />
      </form>
    </Modal>
  );
}

export { validate };