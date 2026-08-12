// =====================================================================
// ProjectFilters — search + status + owner + sort controls.
// Pure presentational: parent owns the values and onChange handlers.
// =====================================================================

import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { PROJECT_STATUS, PROJECT_STATUS_LIST, PROJECT_STATUS_LABELS, SORT_DIR } from '../../utils/constants';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...PROJECT_STATUS_LIST.map((status) => ({
    value: status,
    label: PROJECT_STATUS_LABELS[status] || status,
  })),
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Recently updated' },
  { value: 'createdAt', label: 'Recently created' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'progress', label: 'Progress' },
  { value: 'name', label: 'Name (A–Z)' },
];

export default function ProjectFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  ownerId,
  onOwnerChange,
  ownerOptions = [],
  sort,
  onSortChange,
  order,
  onOrderChange,
  onReset,
  totalCount,
  filteredCount,
}) {
  const hasActiveFilters =
    Boolean(search) || (status && status !== 'all') || (ownerId && ownerId !== 'all');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1 min-w-[14rem]">
          <Input
            label="Search"
            placeholder="Search by name, code, or description..."
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Icon name="search" size="sm" />}
          />
        </div>
        <div className="grid grid-cols-2 md:flex md:items-end gap-3">
          <Select
            label="Status"
            value={status || 'all'}
            onChange={(e) => onStatusChange(e.target.value)}
            options={STATUS_OPTIONS}
            className="md:w-40"
            selectClassName="w-full"
          />
          <Select
            label="Owner"
            value={ownerId || 'all'}
            onChange={(e) => onOwnerChange(e.target.value)}
            options={[{ value: 'all', label: 'All owners' }, ...ownerOptions]}
            className="md:w-48"
            selectClassName="w-full"
          />
          <Select
            label="Sort by"
            value={sort || 'updatedAt'}
            onChange={(e) => onSortChange(e.target.value)}
            options={SORT_OPTIONS}
            className="md:w-48"
            selectClassName="w-full"
          />
          <Select
            label="Order"
            value={order || SORT_DIR.DESC}
            onChange={(e) => onOrderChange(e.target.value)}
            options={[
              { value: SORT_DIR.DESC, label: 'Descending' },
              { value: SORT_DIR.ASC, label: 'Ascending' },
            ]}
            className="md:w-36"
            selectClassName="w-full"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
        <div>
          Showing <span className="font-semibold text-text">{filteredCount}</span> of{' '}
          <span className="font-semibold text-text">{totalCount}</span> projects
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

// Keep status constants re-exported for callers that need them without
// reaching into utils themselves.
export { PROJECT_STATUS };