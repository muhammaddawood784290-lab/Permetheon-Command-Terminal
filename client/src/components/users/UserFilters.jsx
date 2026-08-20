// =====================================================================
// UserFilters — search + role + status filters and a Reset button.
// The page keeps the source-of-truth state; this component is purely
// presentational so the URL-sync effect on the page stays simple.
// =====================================================================

import Card, { CardBody } from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import FilterBar from '../ui/FilterBar';
import { ROLE, ROLE_LABELS, USER_STATUS, USER_STATUS_LABELS, SORT_DIR } from '../../utils/constants';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  ...Object.values(ROLE).map((value) => ({ value, label: ROLE_LABELS[value] })),
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...Object.values(USER_STATUS).map((value) => ({ value, label: USER_STATUS_LABELS[value] })),
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'role', label: 'Role' },
  { value: 'status', label: 'Status' },
  { value: 'createdAt', label: 'Created' },
  { value: 'lastLoginAt', label: 'Last login' },
];

const isFiltered = (filters) =>
  !!filters.search ||
  (filters.role && filters.role !== 'all') ||
  (filters.status && filters.status !== 'all');

export default function UserFilters({
  filters,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onSortChange,
  onOrderChange,
  onReset,
  onRefresh,
  refreshing,
}) {
  return (
    <div className="flex flex-col gap-3">
      <FilterBar>
        <div className="flex-1 min-w-[220px]">
          <Input
            placeholder="Search by name, email, or title"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Icon name="search" size="sm" />}
            aria-label="Search users"
          />
        </div>
        <div className="w-40">
          <Select
            value={filters.role}
            onChange={(e) => onRoleChange(e.target.value)}
            options={ROLE_OPTIONS}
            aria-label="Filter by role"
          />
        </div>
        <div className="w-44">
          <Select
            value={filters.status}
            onChange={(e) => onStatusChange(e.target.value)}
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
          />
        </div>
        <div className="w-40">
          <Select
            value={filters.sort}
            onChange={(e) => onSortChange(e.target.value)}
            options={SORT_OPTIONS}
            aria-label="Sort field"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={
            <Icon
              name={filters.order === SORT_DIR.ASC ? 'arrowUp' : 'arrowDown'}
              size="sm"
            />
          }
          onClick={() =>
            onOrderChange(filters.order === SORT_DIR.ASC ? SORT_DIR.DESC : SORT_DIR.ASC)
          }
          aria-label="Toggle sort order"
        >
          {filters.order === SORT_DIR.ASC ? 'Ascending' : 'Descending'}
        </Button>
        {isFiltered(filters) && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="x" size="sm" />}
            onClick={onReset}
          >
            Reset
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Icon name="refresh" size="sm" />}
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </FilterBar>
    </div>
  );
}
