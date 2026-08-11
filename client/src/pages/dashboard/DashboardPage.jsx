// =====================================================================
// DashboardPage — at-a-glance overview per role.
// =====================================================================

import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../../layouts/PageContainer';
import Card, { CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import LoadingState from '../../components/ui/LoadingState';
import EmptyState from '../../components/ui/EmptyState';
import { TaskStatusBadge, TaskPriorityBadge, ProjectStatusBadge } from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { useToast } from '../../context/ToastContext';
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import reviewService from '../../services/reviewService';
import activityService from '../../services/activityService';
import developerService from '../../services/developerService';
import { mockProjects, mockReviews } from '../../mock/mockData';
import { formatRelativeTime, isOverdue } from '../../utils/formatDate';
import { TASK_STATUS, REVIEW_STATUS } from '../../utils/constants';

function StatCard({ icon, label, value, sub, tone = 'primary', to }) {
  const tones = {
    primary: 'bg-primary-500/10 text-primary-300',
    success: 'bg-success-soft text-success-light',
    warning: 'bg-warning-soft text-warning-light',
    danger: 'bg-danger-soft text-danger-light',
    info: 'bg-info-soft text-info-light',
  };
  const content = (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-text-muted">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-text">{value}</div>
            {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
          </div>
          <div className={`h-10 w-10 rounded-md flex items-center justify-center ${tones[tone]}`}>
            <Icon name={icon} size="md" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
  return to ? <Link to={to} className="block hover:opacity-95">{content}</Link> : content;
}

function MyTasks({ user }) {
  const { data, loading } = useAsync(() => taskService.myTasks(user.id), [user.id]);

  const tasks = data?.data || [];
  const inProgress = tasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS);
  const overdue = tasks.filter((t) => isOverdue(t.deadline, t.status));
  const upcoming = tasks
    .filter((t) => t.status !== TASK_STATUS.COMPLETED && t.status !== TASK_STATUS.CANCELLED)
    .filter((t) => !overdue.includes(t))
    .sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle subtitle="Currently active and upcoming">My active tasks</CardTitle>
        <Link to="/tasks/me">
          <Button size="sm" variant="ghost" rightIcon={<Icon name="chevronRight" size="sm" />}>
            View all
          </Button>
        </Link>
      </CardHeader>
      <CardBody className="space-y-3">
        {loading ? (
          <LoadingState rows={3} height="h-14" />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon="checkSquare"
            title="No tasks assigned to you"
            description="New tasks will appear here once you're assigned."
          />
        ) : (
          <>
            {inProgress.length > 0 && (
              <div className="text-2xs uppercase tracking-wide text-text-muted mb-1">
                In Progress · {inProgress.length}
              </div>
            )}
            {inProgress.slice(0, 2).map((t) => (
              <Link
                key={t.id}
                to={`/tasks/${t.id}`}
                className="block bg-bg-elevated/40 hover:bg-bg-elevated rounded-md p-3 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm text-text truncate">{t.title}</div>
                    <div className="text-xs text-text-muted mt-1">
                      {t.code}
                      {t.deadline && (
                        <span className={isOverdue(t.deadline, t.status) ? 'text-danger-light ml-2' : 'ml-2'}>
                          Due {formatRelativeTime(t.deadline)}
                        </span>
                      )}
                    </div>
                  </div>
                  <TaskPriorityBadge priority={t.priority} size="sm" />
                </div>
              </Link>
            ))}

            {overdue.length > 0 && (
              <div className="text-2xs uppercase tracking-wide text-danger-light mt-3 mb-1">
                Overdue · {overdue.length}
              </div>
            )}
            {overdue.slice(0, 2).map((t) => (
              <Link
                key={t.id}
                to={`/tasks/${t.id}`}
                className="block bg-danger-soft/40 hover:bg-danger-soft rounded-md p-3 transition-colors border border-danger/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm text-text truncate">{t.title}</div>
                    <div className="text-xs text-danger-light mt-1">
                      {t.code} · overdue {formatRelativeTime(t.deadline)}
                    </div>
                  </div>
                  <TaskPriorityBadge priority={t.priority} size="sm" />
                </div>
              </Link>
            ))}

            {upcoming.length > 0 && (
              <div className="text-2xs uppercase tracking-wide text-text-muted mt-3 mb-1">
                Upcoming
              </div>
            )}
            {upcoming.slice(0, 3).map((t) => (
              <Link
                key={t.id}
                to={`/tasks/${t.id}`}
                className="block bg-bg-elevated/30 hover:bg-bg-elevated rounded-md p-3 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm text-text truncate">{t.title}</div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {t.code}
                      {t.deadline && <span className="ml-2">Due {formatRelativeTime(t.deadline)}</span>}
                    </div>
                  </div>
                  <TaskStatusBadge status={t.status} size="sm" />
                </div>
              </Link>
            ))}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function ReviewQueue({ user }) {
  const { data, loading } = useAsync(() => reviewService.list({ reviewerId: user.id }), [user.id]);
  const reviews = data?.data?.items || [];

  const pending = reviews.filter(
    (r) =>
      r.status === REVIEW_STATUS.SUBMITTED ||
      r.status === REVIEW_STATUS.IN_REVIEW ||
      r.status === REVIEW_STATUS.RESUBMITTED,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle subtitle={`${pending.length} awaiting your decision`}>Review queue</CardTitle>
        <Link to="/reviews">
          <Button size="sm" variant="ghost" rightIcon={<Icon name="chevronRight" size="sm" />}>
            View all
          </Button>
        </Link>
      </CardHeader>
      <CardBody className="space-y-2">
        {loading ? (
          <LoadingState rows={3} height="h-14" />
        ) : pending.length === 0 ? (
          <EmptyState
            icon="review"
            title="No pending reviews"
            description="You're all caught up."
          />
        ) : (
          pending.slice(0, 4).map((r) => (
            <Link
              key={r.id}
              to={`/reviews/${r.id}`}
              className="block bg-bg-elevated/40 hover:bg-bg-elevated rounded-md p-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm text-text truncate">{r.taskTitle}</div>
                  <div className="text-xs text-text-muted mt-1">
                    {r.projectName} · by {r.assigneeName} · attempt {r.attempt}
                  </div>
                </div>
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {formatRelativeTime(r.submittedAt)}
                </span>
              </div>
            </Link>
          ))
        )}
      </CardBody>
    </Card>
  );
}

function RecentActivity() {
  const { data, loading } = useAsync(() => activityService.list({ limit: 10 }), []);
  const items = data?.data?.items || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle subtitle="Latest events across PCT">Recent activity</CardTitle>
        <Link to="/activity">
          <Button size="sm" variant="ghost" rightIcon={<Icon name="chevronRight" size="sm" />}>
            View all
          </Button>
        </Link>
      </CardHeader>
      <CardBody>
        {loading ? (
          <LoadingState rows={5} height="h-12" />
        ) : items.length === 0 ? (
          <EmptyState icon="activity" title="No recent activity" />
        ) : (
          <ul className="divide-y divide-bg-elevated">
            {items.slice(0, 8).map((a) => (
              <li key={a.id} className="py-2.5 flex items-start gap-3">
                <Avatar name={a.actorName} color="#3b6ff4" size="xs" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text">{a.summary}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {formatRelativeTime(a.createdAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function ProjectProgressList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle subtitle="Progress across active projects">Projects</CardTitle>
        <Link to="/projects">
          <Button size="sm" variant="ghost" rightIcon={<Icon name="chevronRight" size="sm" />}>
            View all
          </Button>
        </Link>
      </CardHeader>
      <CardBody>
        <ul className="divide-y divide-bg-elevated">
          {mockProjects.map((p) => (
            <li key={p.id} className="py-3 first:pt-0 last:pb-0">
              <Link to={`/projects/${p.id}`} className="block hover:opacity-95">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text truncate">{p.name}</div>
                    <div className="text-xs text-text-muted">{p.code}</div>
                  </div>
                  <ProjectStatusBadge status={p.status} size="sm" />
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar value={p.progress} className="flex-1" size="sm" />
                  <span className="text-xs text-text-muted w-9 text-right">{p.progress}%</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function TeamWorkload() {
  // Pull workload data via the existing developerService rather than
  // reaching into mock data directly — this keeps the dashboard aligned
  // with the service-layer architecture and Phase 2 API swap.
  const { data, loading } = useAsync(() => developerService.workload(), []);
  const rows = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle subtitle="Open tasks per developer">Team workload</CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <LoadingState rows={4} height="h-8" />
        ) : rows.length === 0 ? (
          <EmptyState icon="users" title="No developers yet" />
        ) : (
          <ul className="space-y-3">
            {rows.map((d) => {
              // "open" = everything not yet completed or cancelled.
              const open = d.total - d.completed;
              return (
                <li key={d.userId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={d.name} size="xs" />
                    <div className="min-w-0">
                      <div className="text-sm text-text truncate">{d.name}</div>
                      {d.title && (
                        <div className="text-[11px] text-text-muted truncate">{d.title}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-text-secondary">{open}</div>
                    <div className="text-[10px] text-text-muted">open</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { push } = useToast();

  const { data: taskStats } = useAsync(() => taskService.stats(), []);
  const { data: projectStats } = useAsync(() => projectService.stats(), []);

  useEffect(() => {
    // Friendly welcome on first dashboard visit.
    if (user) {
      push({ type: 'info', message: `Welcome, ${user.name.split(' ')[0]}.` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <PageContainer
      title={`${greeting}, ${user?.name?.split(' ')[0]}`}
      subtitle="Here's what's happening across your workspace today."
    >
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="checkSquare"
          label="Active tasks"
          value={taskStats?.data?.inProgress ?? '—'}
          sub={`${taskStats?.data?.inReview ?? 0} in review`}
          to="/tasks"
        />
        <StatCard
          icon="flag"
          label="Overdue"
          value={taskStats?.data?.overdue ?? '—'}
          sub={taskStats?.data?.overdue ? 'Needs attention' : 'All on track'}
          tone={taskStats?.data?.overdue ? 'danger' : 'success'}
          to="/tasks"
        />
        <StatCard
          icon="review"
          label="Open reviews"
          value={mockReviews.filter(
            (r) =>
              r.status === REVIEW_STATUS.SUBMITTED ||
              r.status === REVIEW_STATUS.IN_REVIEW ||
              r.status === REVIEW_STATUS.RESUBMITTED,
          ).length}
          sub="Awaiting decision"
          tone="warning"
          to="/reviews"
        />
        <StatCard
          icon="folder"
          label="Active projects"
          value={projectStats?.data?.active ?? '—'}
          sub={`${projectStats?.data?.total ?? 0} total`}
          tone="info"
          to="/projects"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2 space-y-4">
          <MyTasks user={user} />
          <RecentActivity />
        </div>
        <div className="space-y-4">
          <ReviewQueue user={user} />
          <ProjectProgressList />
          <TeamWorkload />
        </div>
      </div>
    </PageContainer>
  );
}
