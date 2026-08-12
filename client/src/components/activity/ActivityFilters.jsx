// =====================================================================
// ActivityFilters — search + actor + multi-action + target type +
// project + date range + sort. Pure presentational; the parent owns
// the values and the onChange callbacks (matches the pattern used by
// NotificationFilters and TaskFilters).
//
// The action picker is a multi-select rendered as a pill list so the
// user can quickly combine categories (e.g. "everything Liz did
// around tasks"). Date pickers are plain inputs for now — the design
// system doesn't ship a calendar widget yet.
// =====================================================================

import { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import {
  ACTIVITY_ACTION_LABELS,
  ACTIVITY_ACTION_CATEGORY_LABELS,
  ACTIVITY_ACTION_CATEGORY_MAP,
  ACTIVITY_TARGET_LABELS,
  SORT_DIR,
} from '../../utils/constants';

const TARGET_TYPE_OPTIONS = [
  { value: 'all', label: 'All targets' },
  ...Object.values(ACTIVITY_TARGET_LABELS).map((label, idx) => ({
    value: ['task', 'project', 'user', 'comment', 'file', 'review', 'notification'][idx],
    label,
  })),
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Most recent' },
  { value: 'action', label: 'Action (A–Z)' },
  { value: 'actorName', label: 'Actor (A–Z)' },
  { value: 'targetLabel', label: 'Target (A–Z)' },
];

function ActionPicker({ available, selected, onChange }) {
  // Group available actions by category for a tidier picker.
  const byCategory = {};
  available.forEach((action) => {
    const category = ACTIVITY_ACTION_CATEGORY_MAP[action] || 'SYSTEM';
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(action);
  });

  const toggle = (action) => {
    if (selected.includes(action)) {
      onChange(selected.filter((a) => a !== action));
    } else {
      onChange([...selected, action]);
    }
  };

  const clear = () => onChange([]);

  return (
    <div className="border border-border-subtle rounded-md p-3 bg-bg-elevated/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-secondary">Actions</span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-2xs text-primary-400 hover:underline"
          >
            Clear actions
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
        {Object.entries(byCategory).map(([category, actions]) => (
          <div key={category}>
            <div className="text-2xs uppercase tracking-wide text-text-muted mb-1">
              {ACTIVITY_ACTION_CATEGORY_LABELS[category] || category}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {actions.map((action) => {
                const active = selected.includes(action);
                return (
                  <button
                    type="button"
                    key={action}
                    onClick={() => toggle(action)}
                    className={[
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs border transition-colors',
                      active
                        ? 'bg-primary-500/20 text-primary-200 border-primary-500/50'
                        : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-primary-500/40',
                    ].join(' ')}
                  >
                    {active && <Icon name="check" size="xs" />}
                    {ACTIVITY_ACTION_LABELS[action] || action}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActivityFilters({
  search,
  onSearchChange,
  actor,
  onActorChange,
  actions,
  onActionsChange,
  targetType,
  onTargetTypeChange,
  project,
  onProjectChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  sort,
  onSortChange,
  order,
  onOrderChange,
  onReset,
  options,
  totalCount,
  filteredCount,
}) {
  const [showActions, setShowActions] = useState(false);

  const actorOptions = [
    { value: 'all', label: 'All actors' },
    ...(options?.actors || []).map((a) => ({
      value: a.id,
      label: a.name,
    })),
  ];

  const projectOptions = [
    { value: 'all', label: 'All projects' },
    ...(options?.projects || []).map((id) => ({
      value: id,
      label: id,
    })),
  ];

  const hasActiveFilters =
    Boolean(search) ||
    (actor && actor !== 'all') ||
    (Array.isArray(actions) && actions.length > 0) ||
    (targetType && targetType !== 'all') ||
    (project && project !== 'all') ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Input
            label="Search"
            placeholder="Search summary, actor, or target..."
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Icon name="search" size="sm" />}
          />
        </div>
        <Select
          label="Actor"
          value={actor || 'all'}
          onChange={(e) => onActorChange(e.target.value)}
          options={actorOptions}
          selectClassName="w-full"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Select
          label="Target type"
          value={targetType || 'all'}
          onChange={(e) => onTargetTypeChange(e.target.value)}
          options={TARGET_TYPE_OPTIONS}
          selectClassName="w-full"
        />
        <Select
          label="Project"
          value={project || 'all'}
          onChange={(e) => onProjectChange(e.target.value)}
          options={projectOptions}
          selectClassName="w-full"
        />
        <Select
          label="Sort by"
          value={sort || 'createdAt'}
          onChange={(e) => onSortChange(e.target.value)}
          options={SORT_OPTIONS}
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
          selectClassName="w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="From"
          type="date"
          value={dateFrom || ''}
          onChange={(e) => onDateFromChange(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={dateTo || ''}
          onChange={(e) => onDateToChange(e.target.value)}
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowActions((s) => !s)}
          className="inline-flex items-center gap-2 text-xs text-text-secondary hover:text-text"
          aria-expanded={showActions}
        >
          <Icon name={showActions ? 'chevronDown' : 'chevronRight'} size="sm" />
          Actions
          {Array.isArray(actions) && actions.length > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary-500/20 text-primary-300 text-2xs font-medium">
              {actions.length}
            </span>
          )}
        </button>
        {showActions && (
          <div className="mt-2">
            <ActionPicker
              available={options?.actions || []}
              selected={actions || []}
              onChange={onActionsChange}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
        <div>
          Showing <span className="font-semibold text-text">{filteredCount}</span> of{' '}
          <span className="font-semibold text-text">{totalCount}</span> events
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
