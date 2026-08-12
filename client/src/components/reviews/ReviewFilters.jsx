// =====================================================================
// ReviewFilters — search + status + project + reviewer + assignee +
// sort controls. Pure presentational: parent owns the values and
// onChange handlers. Mirrors TaskFilters so reviewers and operators
// have a consistent filter experience across both modules.
// =====================================================================

import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import {
  REVIEW_STATUS,
  REVIEW_STATUS_LABELS,
  SORT_DIR,
} from '../../utils/constants';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...Object.values(REVIEW_STATUS).map((status) => ({
    value: status,
    label: REVIEW_STATUS_LABELS[status] || status,
  })),
];

const PROJECT_OPTIONS = [{ value: 'all', label: 'All projects' }];

const REVIEWER_OPTIONS = [{ value: 'all', label: 'All reviewers' }];

const ASSIGNEE_OPTIONS = [
  { value: 'all', label: 'All developers' },
  { value: 'unassigned', label: '— Unassigned —' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Recently updated' },
  { value: 'submittedAt', label: 'Recently submitted' },
  { value: 'attempt', label: 'Attempt number' },
  { value: 'taskTitle', label: 'Task (A–Z)' },
  { value: 'projectName', label: 'Project (A–Z)' },
];

export default function ReviewFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  projectId,
  onProjectChange,
  projectOptions = [],
  reviewerId,
  onReviewerChange,
  reviewerOptions = [],
  assigneeId,
  onAssigneeChange,
  assigneeOptions = [],
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
    (projectId && projectId !== 'all') ||
    (reviewerId && reviewerId !== 'all') ||
    (assigneeId && assigneeId !== 'all');

  const projectChoices = [
    ...PROJECT_OPTIONS,
    ...projectOptions.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` })),
  ];
  const reviewerChoices = [
    ...REVIEWER_OPTIONS,
    ...reviewerOptions.map((u) => ({ value: u.id, label: u.name })),
  ];
  const assigneeChoices = [
    ...ASSIGNEE_OPTIONS,
    ...assigneeOptions.map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex-1 min-w-[14rem]">
        <Input
          label="Search"
          placeholder="Search by task, project, reviewer, developer, or feedback..."
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
        {!isHidden('projectId') && (
          <Select
            label="Project"
            value={projectId || 'all'}
            onChange={(e) => onProjectChange(e.target.value)}
            options={projectChoices}
            selectClassName="w-full"
          />
        )}
        {!isHidden('reviewerId') && (
          <Select
            label="Reviewer"
            value={reviewerId || 'all'}
            onChange={(e) => onReviewerChange(e.target.value)}
            options={reviewerChoices}
            selectClassName="w-full"
          />
        )}
        {!isHidden('assigneeId') && (
          <Select
            label="Developer"
            value={assigneeId || 'all'}
            onChange={(e) => onAssigneeChange(e.target.value)}
            options={assigneeChoices}
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

      <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
        <div>
          Showing <span className="font-semibold text-text">{filteredCount}</span> of{' '}
          <span className="font-semibold text-text">{totalCount}</span> reviews
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

export { REVIEW_STATUS };