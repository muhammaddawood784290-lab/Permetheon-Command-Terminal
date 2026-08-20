// =====================================================================
// DashboardPage — at-a-glance overview per role.
//
// Synchronization contract (per DASHBOARD.md):
//   - Every metric comes from the canonical service layer (taskService,
//     projectService, reviewService, activityService, userService,
//     developerService, notificationService). The Dashboard must NOT
//     reach into mock data directly.
//   - Live refresh: every mutation in any module pushes through
//     `recordActivity` which fires `subscribeActivityChange`. We listen
//     to that pub/sub and bump a refresh key so every useAsync re-fetches.
//     Window focus also re-fetches.
//   - The "Open reviews" KPI and the Projects list, plus role-specific
//     KPIs (Total Users for ADMIN, Developer Workload for TEAM_LEAD),
//     are all sourced from the corresponding service to keep the
//     Dashboard in lock-step with the rest of the application.
// =====================================================================

import { useEffect, useMemo, useState, useCallback } from 'react';
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
import { useNotifications } from '../../context/NotificationContext';

import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import reviewService from '../../services/reviewService';
import activityService from '../../services/activityService';
import developerService from '../../services/developerService';
import userService from '../../services/userService';
import { subscribeActivityChange } from '../../services/activityHelpers';

import { formatRelativeTime, isOverdue } from '../../utils/formatDate';
import { TASK_STATUS, REVIEW_STATUS, ROLE } from '../../utils/constants';
import { hasPermission } from '../../utils/permissions';

// ---------------------------------------------------------------------
// Hook: live refresh
//
// Returns a numeric `refreshKey` that increments whenever:
//   - any service mutation publishes through subscribeActivityChange, or
//   - the window regains focus.
// Pass it into useAsync deps so all data sources re-fetch in lock-step.
// ---------------------------------------------------------------------
function useLiveRefresh() {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const unsub = subscribeActivityChange(() => bump());
    const onFocus = () => bump();
    window.addEventListener('focus', onFocus);
    return () => {
      unsub();
      window.removeEventListener('focus', onFocus);
    };
  }, [bump]);

  return refreshKey;
}

// ---------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------
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
  return to ? (
    <Link to={to} className="block hover:opacity-95">
      {content}
    </Link>
  ) : (
    content
  );
}

// ---------------------------------------------------------------------
// MyTasks — sourced from taskService.myTasks(user.id)
// ---------------------------------------------------------------------
function MyTasks({ user, refreshKey }) {
  const { data, loading } = useAsync(
    () => taskService.myTasks(user.id),
    [user.id, refreshKey],
  );

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
                        <span
                          className={isOverdue(t.deadline, t.status) ? 'text-danger-light ml-2' : 'ml-2'}
                        >
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

// ---------------------------------------------------------------------
// ReviewQueue — sourced from reviewService.list({ reviewerId })
// ---------------------------------------------------------------------
function ReviewQueue({ user, refreshKey }) {
  const { data, loading } = useAsync(
    () =>
      reviewService.list({
        reviewerId: user.id,
        limit: 50,
      }),
    [user.id, refreshKey],
  );
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
          <EmptyState icon="review" title="No pending reviews" description="You're all caught up." />
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

// ---------------------------------------------------------------------
// RecentActivity — sourced from activityService.list({ limit: 10 })
// ---------------------------------------------------------------------
function RecentActivity({ refreshKey }) {
  const { data, loading } = useAsync(
    () => activityService.list({ limit: 10 }),
    [refreshKey],
  );
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

// ---------------------------------------------------------------------
// ProjectProgressList — sourced from projectService.list({ status: ACTIVE })
// ---------------------------------------------------------------------
function ProjectProgressList({ refreshKey }) {
  const { data, loading } = useAsync(
    () => projectService.list({ status: 'ACTIVE', limit: 50 }),
    [refreshKey],
  );
  const projects = data?.data?.items || [];

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
        {loading ? (
          <LoadingState rows={3} height="h-10" />
        ) : projects.length === 0 ? (
          <EmptyState icon="folder" title="No active projects" />
        ) : (
          <ul className="divide-y divide-bg-elevated">
            {projects.slice(0, 5).map((p) => (
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
                    <ProgressBar value={p.progress ?? 0} className="flex-1" size="sm" />
                    <span className="text-xs text-text-muted w-9 text-right">
                      {p.progress ?? 0}%
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------
// TeamWorkload — sourced from developerService.workload()
// ---------------------------------------------------------------------
function TeamWorkload({ refreshKey }) {
  const { data, loading } = useAsync(() => developerService.workload(), [refreshKey]);
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
            {rows.slice(0, 6).map((d) => {
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

// ---------------------------------------------------------------------
// NotificationsWidget — sourced from NotificationContext (the
// notification service is the canonical owner; unreadCount is provided
// by the context provider, which already re-fetches on user change).
// ---------------------------------------------------------------------
function NotificationsWidget({ user }) {
  const { notifications, unreadCount, loading } = useNotifications();
  const recent = useMemo(
    () =>
      [...notifications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [notifications],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle
          subtitle={
            unreadCount > 0
              ? `${unreadCount} unread`
              : notifications.length > 0
                ? 'All caught up'
                : 'No notifications yet'
          }
        >
          <span className="inline-flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-2xs rounded-full bg-danger text-white">
                {unreadCount}
              </span>
            )}
          </span>
        </CardTitle>
        <Link to="/notifications">
          <Button size="sm" variant="ghost" rightIcon={<Icon name="chevronRight" size="sm" />}>
            View all
          </Button>
        </Link>
      </CardHeader>
      <CardBody>
        {loading ? (
          <LoadingState rows={3} height="h-10" />
        ) : recent.length === 0 ? (
          <EmptyState icon="bell" title="No notifications yet" />
        ) : (
          <ul className="divide-y divide-bg-elevated">
            {recent.map((n) => (
              <li key={n.id} className="py-2 first:pt-0 last:pb-0 flex items-start gap-2">
                {!n.read && (
                  <span
                    className="mt-2 h-2 w-2 rounded-full bg-primary-500 shrink-0"
                    aria-label="Unread"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${n.read ? 'text-text-secondary' : 'text-text'}`}>
                    {n.title || n.message || n.type}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {formatRelativeTime(n.createdAt)}
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

// ---------------------------------------------------------------------
// QuickActions — permission-aware
// ---------------------------------------------------------------------
function QuickActions({ user }) {
  if (!user) return null;

  const actions = [];
  if (hasPermission(user, 'task.create')) {
    actions.push({ to: '/tasks', label: 'New task', icon: 'checkSquare' });
  }
  if (hasPermission(user, 'project.create')) {
    actions.push({ to: '/projects', label: 'New project', icon: 'folder' });
  }
  if (hasPermission(user, 'user.create')) {
    actions.push({ to: '/users', label: 'Invite user', icon: 'userCheck' });
  }
  if (hasPermission(user, 'report.view')) {
    actions.push({ to: '/reports', label: 'View reports', icon: 'activity' });
  }

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle subtitle="Jump into common workflows">Quick actions</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((a) => (
            <Link
              key={a.to + a.label}
              to={a.to}
              className="flex items-center gap-2 p-2 rounded-md bg-bg-elevated/40 hover:bg-bg-elevated transition-colors"
            >
              <Icon name={a.icon} size="sm" className="text-primary-300" />
              <span className="text-sm text-text truncate">{a.label}</span>
            </Link>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------
export default function DashboardPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const refreshKey = useLiveRefresh();

  // Sourced entirely from the service layer.
  const { data: taskStats } = useAsync(() => taskService.stats(), [refreshKey]);
  const { data: projectStats } = useAsync(() => projectService.stats(), [refreshKey]);
  const { data: reviewStats } = useAsync(() => reviewService.stats(), [refreshKey]);
  const { data: userStats } = useAsync(
    () => (hasPermission(user, 'user.view') ? userService.stats() : Promise.resolve(null)),
    [user?.role, refreshKey],
  );

  // Welcome toast — gated by sessionStorage so it only fires once per
  // browser session, never on every navigation back to /dashboard.
  useEffect(() => {
    if (!user) return;
    try {
      const WELCOME_KEY = 'pct_dashboard_welcomed';
      if (window.sessionStorage.getItem(WELCOME_KEY) === user.id) return;
      window.sessionStorage.setItem(WELCOME_KEY, user.id);
      push({ type: 'info', message: `Welcome, ${user.name.split(' ')[0]}.` });
    } catch {
      // sessionStorage unavailable — skip silently rather than spam toasts.
    }
  }, [user, push]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Compute the Open reviews KPI from reviewService.stats() so we
  // share the same source of truth as the Reviews page.
  const openReviewsCount = useMemo(() => {
    const s = reviewStats?.data;
    if (!s) return null;
    // "Open" matches what the rest of the app considers pending:
    // SUBMITTED + IN_REVIEW + RESUBMITTED. We derive it from the
    // stats shape rather than re-reading mockReviews.
    const submitted = s.submitted ?? 0;
    const inReview = s.inReview ?? 0;
    const resubmitted = s.resubmitted ?? 0;
    return submitted + inReview + resubmitted;
  }, [reviewStats]);

  // Role-aware KPI grid (per DASHBOARD.md §20-23).
  const role = user?.role;
  const isAdmin = role === ROLE.ADMIN;
  const isTeamLead = role === ROLE.TEAM_LEAD;
  const isDeveloper = role === ROLE.DEVELOPER;

  // Build a role-specific KPI list. Always exactly 4 cards; padded
  // with sensible role-appropriate defaults when the role has fewer
  // role-specific stats.
  const roleKpis = useMemo(() => {
    const cards = [];

    if (isAdmin) {
      cards.push(
        <StatCard
          key="total-users"
          icon="users"
          label="Total users"
          value={userStats?.data?.total ?? '—'}
          sub={`${userStats?.data?.active ?? 0} active`}
          to="/users"
        />,
      );
      cards.push(
        <StatCard
          key="active-developers"
          icon="userCheck"
          label="Active developers"
          value={userStats?.data?.byRole?.[ROLE.DEVELOPER] ?? '—'}
          sub={`${userStats?.data?.activeAdmins ?? 0} active admins`}
          to="/users"
        />,
      );
      cards.push(
        <StatCard
          key="active-tasks"
          icon="checkSquare"
          label="Active tasks"
          value={taskStats?.data?.inProgress ?? '—'}
          sub={`${taskStats?.data?.inReview ?? 0} in review`}
          to="/tasks"
        />,
      );
      cards.push(
        <StatCard
          key="overdue"
          icon="flag"
          label="Overdue"
          value={taskStats?.data?.overdue ?? '—'}
          sub={taskStats?.data?.overdue ? 'Needs attention' : 'All on track'}
          tone={taskStats?.data?.overdue ? 'danger' : 'success'}
          to="/tasks?deadline=overdue"
        />,
      );
    } else if (isTeamLead) {
      cards.push(
        <StatCard
          key="managed-projects"
          icon="folder"
          label="Managed projects"
          value={
            projectStats?.data?.total != null
              ? projectStats.data.active + projectStats.data.planning
              : '—'
          }
          sub="Active + planning"
          to="/projects"
        />,
      );
      cards.push(
        <StatCard
          key="active-reviews"
          icon="shield"
          label="Active reviews"
          value={reviewStats?.data?.inReview ?? '—'}
          sub="Currently being reviewed"
          tone="warning"
          to="/reviews"
        />,
      );
      cards.push(
        <StatCard
          key="open-reviews"
          icon="review"
          label="Open reviews"
          value={openReviewsCount ?? '—'}
          sub="Awaiting decision"
          tone="warning"
          to="/reviews"
        />,
      );
      cards.push(
        <StatCard
          key="overdue"
          icon="flag"
          label="Overdue"
          value={taskStats?.data?.overdue ?? '—'}
          sub={taskStats?.data?.overdue ? 'Needs attention' : 'All on track'}
          tone={taskStats?.data?.overdue ? 'danger' : 'success'}
          to="/tasks?deadline=overdue"
        />,
      );
    } else if (isDeveloper) {
      const myOpen =
        taskStats?.data?.total != null
          ? Math.max(0, (taskStats.data.total || 0) - (taskStats.data.completed || 0))
          : null;
      cards.push(
        <StatCard
          key="my-tasks"
          icon="checkSquare"
          label="My tasks"
          value={myOpen ?? '—'}
          sub="Open in your queue"
          to="/tasks/me"
        />,
      );
      cards.push(
        <StatCard
          key="need-revision"
          icon="edit"
          label="Need revision"
          value={taskStats?.data?.revisionRequired ?? '—'}
          sub="Awaiting your update"
          tone={taskStats?.data?.revisionRequired ? 'danger' : 'success'}
          to="/tasks?status=REVISION_REQUIRED"
        />,
      );
      cards.push(
        <StatCard
          key="in-review"
          icon="review"
          label="In review"
          value={taskStats?.data?.inReview ?? '—'}
          sub="Awaiting decision"
          tone="warning"
          to="/tasks?status=IN_REVIEW"
        />,
      );
      cards.push(
        <StatCard
          key="overdue"
          icon="flag"
          label="Overdue"
          value={taskStats?.data?.overdue ?? '—'}
          sub={taskStats?.data?.overdue ? 'Needs attention' : 'All on track'}
          tone={taskStats?.data?.overdue ? 'danger' : 'success'}
          to="/tasks?deadline=overdue"
        />,
      );
    } else {
      cards.push(
        <StatCard
          key="open-tasks"
          icon="checkSquare"
          label="Open tasks"
          value={taskStats?.data?.inProgress ?? '—'}
          sub="In progress"
          to="/tasks"
        />,
      );
      cards.push(
        <StatCard
          key="open-reviews"
          icon="review"
          label="Open reviews"
          value={openReviewsCount ?? '—'}
          sub="Awaiting decision"
          tone="warning"
          to="/reviews"
        />,
      );
      cards.push(
        <StatCard
          key="active-projects"
          icon="folder"
          label="Active projects"
          value={projectStats?.data?.active ?? '—'}
          sub={`${projectStats?.data?.total ?? 0} total`}
          tone="info"
          to="/projects"
        />,
      );
      cards.push(
        <StatCard
          key="overdue"
          icon="flag"
          label="Overdue"
          value={taskStats?.data?.overdue ?? '—'}
          sub={taskStats?.data?.overdue ? 'Needs attention' : 'All on track'}
          tone={taskStats?.data?.overdue ? 'danger' : 'success'}
          to="/tasks?deadline=overdue"
        />,
      );
    }

    return cards;
  }, [
    isAdmin,
    isTeamLead,
    isDeveloper,
    userStats,
    taskStats,
    projectStats,
    reviewStats,
    openReviewsCount,
  ]);

  return (
    <PageContainer
      title={`${greeting}, ${user?.name?.split(' ')[0] ?? ''}`}
      subtitle="Here's what's happening across your workspace today."
    >
      {/* KPI row — every metric sourced from a service */}
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
          // Deep-link into the tasks list filtered to overdue.
          to={`/tasks?deadline=overdue`}
        />
        <StatCard
          icon="review"
          label="Open reviews"
          value={openReviewsCount ?? '—'}
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

      {/* Role-specific KPI strip (per DASHBOARD.md §20-23) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {roleKpis}
      </div>

      {/* Quick actions (permission-aware) */}
      <div className="mt-4">
        <QuickActions user={user} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2 space-y-4">
          <MyTasks user={user} refreshKey={refreshKey} />
          <RecentActivity refreshKey={refreshKey} />
        </div>
        <div className="space-y-4">
          <ReviewQueue user={user} refreshKey={refreshKey} />
          <ProjectProgressList refreshKey={refreshKey} />
          <TeamWorkload refreshKey={refreshKey} />
          <NotificationsWidget user={user} />
        </div>
      </div>
    </PageContainer>
  );
}
