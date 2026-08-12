// =====================================================================
// TaskFilters — search + status + priority + project + assignee + sort.
// Pure presentational: parent owns the values and onChange handlers.
// The "status" pill is unlocked by the URL when the page is used
// directly (e.g. clicking a stats card).
// =====================================================================

import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import {
  TASK_STATUS,
  TASK_STATUS_LIST,
  TASK_STATUS_LABELS,
  TASK_PRIORITY,
  TASK_PRIORITY_LIST,
  TASK_PRIORITY_LABELS,
  SORT_DIR,
} from '../../utils/constants';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...TASK_STATUS_LIST.map((status) => ({
    value: status,
    label: TASK_STATUS_LABELS[status] || status,
  })),
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  ...TASK_PRIORITY_LIST.map((p) => ({
    value: p,
    label: TASK_PRIORITY_LABELS[p] || p,
  })),
];

const PROJECT_OPTIONS = [
  { value: 'all', label: 'All projects' },
  { value: 'unassigned', label: '— No project —' },
];

const ASSIGNEE_OPTIONS = [
  { value: 'all', label: 'All assignees' },
  { value: 'unassigned', label: '— Unassigned —' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Recently updated' },
  { value: 'createdAt', label: 'Newest' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title (A–Z)' },
];

const DEADLINE_OPTIONS = [
  { value: 'all', label: 'Any deadline' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due today' },
  { value: 'week', label: 'Due this week' },
  { value: 'none', label: 'No deadline' },
];

const REVIEW_OPTIONS = [
  { value: 'all', label: 'Any review status' },
  { value: 'pending', label: 'Pending review' },
  { value: 'in_review', label: 'In review' },
  { value: 'approved', label: 'Approved' },
  { value: 'revision', label: 'Revision required' },
  { value: 'none', label: 'No review yet' },
];

export default function TaskFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  projectId,
  onProjectChange,
  projectOptions = [],
  assigneeId,
  onAssigneeChange,
  assigneeOptions = [],
  deadline,
  onDeadlineChange,
  review,
  onReviewChange,
  sort,
  onSortChange,
  order,
  onOrderChange,
  onReset,
  totalCount,
  filteredCount,
  hidden = [],
}) {
  const isHidden = (k) => hidden.includes(k);

  const hasActiveFilters =
    Boolean(search) ||
    (status && status !== 'all') ||
    (priority && priority !== 'all') ||
    (projectId && projectId !== 'all') ||
    (assigneeId && assigneeId !== 'all') ||
    (deadline && deadline !== 'all') ||
    (review && review !== 'all');

  const projectChoices = [
    ...PROJECT_OPTIONS,
    ...projectOptions.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` })),
  ];
  const assigneeChoices = [
    ...ASSIGNEE_OPTIONS,
    ...assigneeOptions.map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        <div className="flex-1 min-w-[14rem]">
          <Input
            label="Search"
            placeholder="Search by title, ID, description, project, or assignee..."
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Icon name="search" size="sm" />}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {!isHidden('status') && (
            <Select
              label="Status"
              value={status || 'all'}
              onChange={(e) => onStatusChange(e.target.value)}
              options={STATUS_OPTIONS}
              selectClassName="w-full"
            />
          )}
          {!isHidden('priority') && (
            <Select
              label="Priority"
              value={priority || 'all'}
              onChange={(e) => onPriorityChange(e.target.value)}
              options={PRIORITY_OPTIONS}
              selectClassName="w-full"
            />
          )}
          {!isHidden('projectId') && (
            <Select
              label="Project"
              value={projectId || 'all'}
              onChange={(e) => onProjectChange(e.target.value)}
              options={projectChoices}
              selectClassName="w-full"
            />
          )}
          {!isHidden('assigneeId') && (
            <Select
              label="Assignee"
              value={assigneeId || 'all'}
              onChange={(e) => onAssigneeChange(e.target.value)}
              options={assigneeChoices}
              selectClassName="w-full"
            />
          )}
          {!isHidden('deadline') && (
            <Select
              label="Deadline"
              value={deadline || 'all'}
              onChange={(e) => onDeadlineChange(e.target.value)}
              options={DEADLINE_OPTIONS}
              selectClassName="w-full"
            />
          )}
          {!isHidden('review') && (
            <Select
              label="Review"
              value={review || 'all'}
              onChange={(e) => onReviewChange(e.target.value)}
              options={REVIEW_OPTIONS}
              selectClassName="w-full"
            />
          )}
          {!isHidden('sort') && (
            <Select
              label="Sort by"
              value={sort || 'updatedAt'}
              onChange={(e) => onSortChange(e.target.value)}
              options={SORT_OPTIONS}
              selectClassName="w-full"
            />
          )}
          {!isHidden('order') && (
            <Select
              label="Order"
              value={order || SORT_DIR.DESC}
              onChange={(e) => onOrderChange(e.target.value)}
              options={[
                { value: SORT_DIR.DESC, label: 'Descending' },
                { value: SORT_DIR.ASC, label: 'Ascending' },
              ]}
              selectClassName="w-full"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
        <div>
          Showing <span className="font-semibold text-text">{filteredCount}</span> of{' '}
          <span className="font-semibold text-text">{totalCount}</span> tasks
        </div>
        {hasActiveFilters && (
          <Button
            size="xs"
            variant="ghost"
            leftIcon={<Icon name="x" size="sm" />}
            onClick={onReset}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

// Re-export constants for callers that need them without reaching into
// utils themselves.
export { TASK_STATUS, TASK_PRIORITY };
