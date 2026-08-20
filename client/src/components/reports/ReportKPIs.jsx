// =====================================================================
// ReportKPIs — top-of-page overview card grid.
//
// Renders 8 KPI tiles per REPORTS.md §5: Total Projects, Active
// Projects, Total Tasks, Open Tasks, Completed Tasks, In Review,
// Overdue, Pending Revisions.
// =====================================================================

import Card, { CardBody } from '../ui/Card';
import Icon from '../ui/Icon';

const TONE_CLASSES = {
  primary: 'bg-primary-500/10 text-primary-300',
  success: 'bg-success-soft text-success-light',
  warning: 'bg-warning-soft text-warning-light',
  danger: 'bg-danger-soft text-danger-light',
  info: 'bg-info-soft text-info-light',
  neutral: 'bg-bg-hover text-text-secondary',
};

function KpiCard({ icon, label, value, sub, tone = 'primary', loading }) {
  return (
    <Card className="h-full">
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-text-muted">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-text">
              {loading ? (
                <span className="inline-block h-7 w-12 bg-bg-hover rounded animate-pulse" />
              ) : (
                value
              )}
            </div>
            {sub && <div className="text-xs text-text-muted mt-1 truncate">{sub}</div>}
          </div>
          <div
            className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${
              TONE_CLASSES[tone] || TONE_CLASSES.primary
            }`}
          >
            <Icon name={icon} size="md" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function ReportKPIs({ overview, loading }) {
  const projects = overview?.projects || {};
  const tasks = overview?.tasks || {};

  const cards = [
    {
      icon: 'folder',
      label: 'Total projects',
      value: projects.total ?? 0,
      sub: `${projects.active ?? 0} active · ${projects.completed ?? 0} completed`,
      tone: 'primary',
    },
    {
      icon: 'checkSquare',
      label: 'Total tasks',
      value: tasks.total ?? 0,
      sub: `${tasks.completed ?? 0} completed · ${tasks.inProgress ?? 0} in progress`,
      tone: 'info',
    },
    {
      icon: 'bolt',
      label: 'Open tasks',
      value: tasks.open ?? 0,
      sub: `Backlog ${tasks.backlog ?? 0} · To do ${tasks.assigned ?? 0}`,
      tone: 'primary',
    },
    {
      icon: 'review',
      label: 'In review',
      value: tasks.review ?? 0,
      sub: `${tasks.revision ?? 0} revision required`,
      tone: 'warning',
    },
    {
      icon: 'check',
      label: 'Completed',
      value: tasks.completed ?? 0,
      sub: `${overview?.completionRate ?? 0}% completion rate`,
      tone: 'success',
    },
    {
      icon: 'flag',
      label: 'Overdue',
      value: tasks.overdue ?? 0,
      sub: tasks.overdue > 0 ? 'Needs attention' : 'Nothing overdue',
      tone: tasks.overdue > 0 ? 'danger' : 'neutral',
    },
    {
      icon: 'edit',
      label: 'Revisions',
      value: tasks.revision ?? 0,
      sub: 'Sent back for changes',
      tone: tasks.revision > 0 ? 'danger' : 'neutral',
    },
    {
      icon: 'lock',
      label: 'Blocked',
      value: tasks.blocked ?? 0,
      sub: tasks.blocked > 0 ? 'External blocker' : 'Nothing blocked',
      tone: tasks.blocked > 0 ? 'warning' : 'neutral',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <KpiCard key={card.label} loading={loading} {...card} />
      ))}
    </div>
  );
}
