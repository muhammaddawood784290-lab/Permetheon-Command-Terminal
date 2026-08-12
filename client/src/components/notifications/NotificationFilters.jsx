// =====================================================================
// NotificationFilters — search + read state + type + target + sort
// controls. Pure presentational: the parent owns the values and
// onChange handlers. Mirrors the patterns used by TaskFilters and
// ReviewFilters so users learn the filter experience once.
// =====================================================================

import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_TYPE_LABELS,
  SORT_DIR,
} from '../../utils/constants';

const READ_OPTIONS = [
  { value: 'all', label: 'All notifications' },
  { value: 'unread', label: 'Unread only' },
  { value: 'read', label: 'Read only' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  ...Object.values(NOTIFICATION_TYPE).map((t) => ({
    value: t,
    label: NOTIFICATION_TYPE_LABELS[t] || t,
  })),
];

const TARGET_OPTIONS = [
  { value: 'all', label: 'All targets' },
  { value: 'task', label: 'Tasks' },
  { value: 'project', label: 'Projects' },
  { value: 'review', label: 'Reviews' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Most recent' },
  { value: 'read', label: 'Read state' },
  { value: 'type', label: 'Type (A–Z)' },
];

export default function NotificationFilters({
  search,
  onSearchChange,
  read,
  onReadChange,
  type,
  onTypeChange,
  targetType,
  onTargetTypeChange,
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
    (read && read !== 'all') ||
    (type && type !== 'all') ||
    (targetType && targetType !== 'all');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex-1 min-w-[14rem]">
        <Input
          label="Search"
          placeholder="Search title, message, or actor..."
          value={search || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Icon name="search" size="sm" />}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {!isHidden('read') && (
          <Select
            label="State"
            value={read || 'all'}
            onChange={(e) => onReadChange(e.target.value)}
            options={READ_OPTIONS}
            selectClassName="w-full"
          />
        )}
        {!isHidden('type') && (
          <Select
            label="Type"
            value={type || 'all'}
            onChange={(e) => onTypeChange(e.target.value)}
            options={TYPE_OPTIONS}
            selectClassName="w-full"
          />
        )}
        {!isHidden('targetType') && (
          <Select
            label="Target"
            value={targetType || 'all'}
            onChange={(e) => onTargetTypeChange(e.target.value)}
            options={TARGET_OPTIONS}
            selectClassName="w-full"
          />
        )}
        {!isHidden('sort') && (
          <Select
            label="Sort by"
            value={sort || 'createdAt'}
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
          <span className="font-semibold text-text">{totalCount}</span> notifications
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
