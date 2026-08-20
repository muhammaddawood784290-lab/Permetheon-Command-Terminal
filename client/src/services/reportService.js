// =====================================================================
// reportService — aggregates operational reports from authoritative
// application data (mockTasks / mockProjects / mockReviews / mockActivity
// / mockUsers).
//
// Phase-1 implementation: reads the mock datasets directly. When the
// backend exposes the report endpoints in API.md, only the body of
// these methods needs to change — the public shape stays stable so
// components do not need to be rewritten.
//
// All report methods accept a `filters` object:
//   {
//     dateRange:   'all' | 'today' | 'yesterday' | 'last7' | 'last30'
//                 | 'thisMonth' | 'custom',
//     dateFrom:    ISO string  (used when dateRange === 'custom')
//     dateTo:      ISO string  (used when dateRange === 'custom')
//     projectId:   string | 'all'
//     developerId: string | 'all'
//     status:      string | 'all'   (TASK_STATUS value)
//     priority:    string | 'all'   (TASK_PRIORITY value)
//   }
//
// Date semantics for task/project metrics: a task is "in range" when
// any of its timestamps falls inside the selected window. Reviews and
// activity use their own timestamp fields. This matches the convention
// documented in REPORTS.md §20 — date filters describe the period the
// user is interested in, not a single fixed metric.
//
// Overdue logic (REPORTS.md §17): deadline < now AND status != COMPLETED
// (and not CANCELLED).
// =====================================================================

import { ok } from './api';
import {
  mockActivity,
  mockProjects,
  mockReviews,
  mockTasks,
  mockUsers,
} from '../mock/mockData';
import {
  ACTIVITY_ACTION_CATEGORY_MAP,
  PROJECT_STATUS,
  TASK_PRIORITY,
  TASK_STATUS,
  REVIEW_STATUS,
  USER_STATUS,
} from '../utils/constants';

// ---------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------

function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(value) {
  const d = new Date(value);
  d.setHours(23, 59, 59, 999);
  return d;
}

function dateRangeBounds(range, dateFrom, dateTo, now = new Date()) {
  if (range === 'custom' && dateFrom && dateTo) {
    return { from: startOfDay(dateFrom), to: endOfDay(dateTo) };
  }

  const today = startOfDay(now);

  switch (range) {
    case 'today':
      return { from: today, to: endOfDay(today) };
    case 'yesterday': {
      const y = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'last7': {
      const start = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
      return { from: startOfDay(start), to: endOfDay(today) };
    }
    case 'last30': {
      const start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
      return { from: startOfDay(start), to: endOfDay(today) };
    }
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: startOfDay(start), to: endOfDay(today) };
    }
    case 'all':
    default:
      return null;
  }
}

function inRange(value, bounds) {
  if (!bounds) return true;
  if (!value) return false;
  const t = new Date(value).getTime();
  return t >= bounds.from.getTime() && t <= bounds.to.getTime();
}

// A task is considered "in scope" when any of its timestamps falls in
// the window. That way selecting "Last 7 Days" still shows tasks that
// were merely updated this week even if they were created months ago.
function taskInDateRange(task, bounds) {
  if (!bounds) return true;
  return (
    inRange(task.createdAt, bounds) ||
    inRange(task.updatedAt, bounds) ||
    inRange(task.completedAt, bounds)
  );
}

// ---------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------

function applyCommonFilters(tasks, filters, bounds) {
  return tasks.filter((t) => {
    if (!taskInDateRange(t, bounds)) return false;
    if (filters.projectId && filters.projectId !== 'all' && t.projectId !== filters.projectId) return false;
    if (filters.developerId && filters.developerId !== 'all' && t.assigneeId !== filters.developerId) return false;
    if (filters.status && filters.status !== 'all' && t.status !== filters.status) return false;
    if (filters.priority && filters.priority !== 'all' && t.priority !== filters.priority) return false;
    return true;
  });
}

function isOverdue(task, now = new Date()) {
  if (!task.deadline) return false;
  if (task.status === TASK_STATUS.COMPLETED) return false;
  if (task.status === TASK_STATUS.CANCELLED) return false;
  // `now` may be a Date, an ISO string, a number, or — when this
  // function is passed directly to Array.filter as the predicate —
  // the element index (0, 1, 2, …). Normalize so any caller works.
  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(nowDate.getTime())) return false;
  const deadline = new Date(task.deadline);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline.getTime() < nowDate.getTime();
}

function progressPercent(completed, total) {
  if (!total) return 0;
  return Math.round((completed / total) * 1000) / 10; // one decimal place
}

// ---------------------------------------------------------------------
// Internal aggregations
// ---------------------------------------------------------------------

function buildProjectRows(tasks, projects) {
  return projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const completed = projectTasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length;
    const inProgress = projectTasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length;
    const review = projectTasks.filter(
      (t) => t.status === TASK_STATUS.IN_REVIEW,
    ).length;
    const revision = projectTasks.filter((t) => t.status === TASK_STATUS.REVISION_REQUIRED).length;
    const open = projectTasks.filter((t) => t.status !== TASK_STATUS.COMPLETED).length;
    const overdue = projectTasks.filter(isOverdue).length;

    return {
      id: project.id,
      code: project.code,
      name: project.name,
      status: project.status,
      leadId: project.leadId,
      memberIds: project.memberIds,
      taskCount: projectTasks.length,
      completed,
      open,
      inProgress,
      review,
      revision,
      overdue,
      deadline: project.deadline,
      progress: progressPercent(completed, projectTasks.length),
    };
  });
}

function buildDeveloperRows(tasks, users) {
  // Include every developer + team lead so the workload report always
  // shows the full bench.
  const developers = users.filter(
    (u) => u.status === USER_STATUS.ACTIVE && (u.role === 'DEVELOPER' || u.role === 'TEAM_LEAD'),
  );

  return developers.map((user) => {
    const userTasks = tasks.filter((t) => t.assigneeId === user.id);
    return {
      userId: user.id,
      name: user.name,
      role: user.role,
      title: user.title,
      total: userTasks.length,
      backlog: userTasks.filter((t) => t.status === TASK_STATUS.BACKLOG).length,
      assigned: userTasks.filter((t) => t.status === TASK_STATUS.TODO).length,
      inProgress: userTasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length,
      review: userTasks.filter((t) => t.status === TASK_STATUS.IN_REVIEW).length,
      revision: userTasks.filter((t) => t.status === TASK_STATUS.REVISION_REQUIRED).length,
      completed: userTasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length,
      overdue: userTasks.filter(isOverdue).length,
      openTasks: userTasks.filter((t) => t.status !== TASK_STATUS.COMPLETED).length,
    };
  });
}

function buildReviewQueue(reviews) {
  // "Awaiting reviewer action" — SUBMITTED + IN_REVIEW + RESUBMITTED.
  return reviews
    .filter(
      (r) =>
        r.status === REVIEW_STATUS.SUBMITTED ||
        r.status === REVIEW_STATUS.IN_REVIEW ||
        r.status === REVIEW_STATUS.RESUBMITTED,
    )
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
}

function buildStatusDistribution(tasks) {
  const distribution = Object.values(TASK_STATUS).map((status) => ({
    status,
    count: tasks.filter((t) => t.status === status).length,
  }));
  return distribution;
}

function buildCompletionTrend(tasks, days = 14) {
  // For each day in the last `days` window, count tasks whose
  // completedAt falls on that day. Days with zero completions are
  // included so the chart does not collapse to a single bar.
  const now = new Date();
  const result = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = startOfDay(day).getTime();
    const dayEnd = endOfDay(day).getTime();
    const completed = tasks.filter((t) => {
      if (!t.completedAt) return false;
      const ts = new Date(t.completedAt).getTime();
      return ts >= dayStart && ts <= dayEnd;
    }).length;
    result.push({
      date: day.toISOString().slice(0, 10),
      count: completed,
    });
  }
  return result;
}

function buildDeadlineBuckets(tasks, now = new Date()) {
  const todayStart = startOfDay(now).getTime();
  const todayEnd = endOfDay(now).getTime();
  const weekEnd = todayEnd + 6 * 24 * 60 * 60 * 1000;

  const overdueTasks = tasks
    .filter(isOverdue)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const dueTodayTasks = tasks
    .filter((t) => {
      if (!t.deadline) return false;
      if (t.status === TASK_STATUS.COMPLETED) return false;
      const ts = new Date(t.deadline).getTime();
      return ts >= todayStart && ts <= todayEnd;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const dueThisWeekTasks = tasks
    .filter((t) => {
      if (!t.deadline) return false;
      if (t.status === TASK_STATUS.COMPLETED) return false;
      const ts = new Date(t.deadline).getTime();
      return ts > todayEnd && ts <= weekEnd;
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return {
    overdue: overdueTasks,
    dueToday: dueTodayTasks,
    dueThisWeek: dueThisWeekTasks,
    counts: {
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      dueThisWeek: dueThisWeekTasks.length,
    },
  };
}

function buildActivityBreakdown(entries) {
  const byCategory = {};
  const byAction = {};
  entries.forEach((entry) => {
    const category = ACTIVITY_ACTION_CATEGORY_MAP[entry.action] || 'OTHER';
    byCategory[category] = (byCategory[category] || 0) + 1;
    byAction[entry.action] = (byAction[entry.action] || 0) + 1;
  });
  return {
    total: entries.length,
    byCategory,
    byAction,
  };
}

// ---------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------

function normalizeFilters(filters = {}) {
  return {
    dateRange: filters.dateRange || 'all',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
    projectId: filters.projectId || 'all',
    developerId: filters.developerId || 'all',
    status: filters.status || 'all',
    priority: filters.priority || 'all',
  };
}

export const reportService = {
  /**
   * Overview — top-line KPIs used by the dashboard cards. Tasks are
   * scoped by the active filters; project counts use the date range
   * to filter the project list by `createdAt`.
   */
  async overview(filters = {}) {
    const f = normalizeFilters(filters);
    const bounds = dateRangeBounds(f.dateRange, f.dateFrom, f.dateTo);

    const tasksInScope = applyCommonFilters(mockTasks, f, bounds);
    const projectsInScope = mockProjects.filter((p) => {
      if (!bounds) return true;
      return inRange(p.createdAt, bounds) || inRange(p.updatedAt, bounds);
    });

    const projects = {
      total: projectsInScope.length,
      active: projectsInScope.filter((p) => p.status === PROJECT_STATUS.ACTIVE).length,
      completed: projectsInScope.filter((p) => p.status === PROJECT_STATUS.COMPLETED).length,
      planning: projectsInScope.filter((p) => p.status === PROJECT_STATUS.PLANNING).length,
      onHold: projectsInScope.filter((p) => p.status === PROJECT_STATUS.ON_HOLD).length,
      archived: projectsInScope.filter((p) => p.status === PROJECT_STATUS.ARCHIVED).length,
    };

    const tasks = {
      total: tasksInScope.length,
      open: tasksInScope.filter((t) => t.status !== TASK_STATUS.COMPLETED && t.status !== TASK_STATUS.CANCELLED).length,
      backlog: tasksInScope.filter((t) => t.status === TASK_STATUS.BACKLOG).length,
      assigned: tasksInScope.filter((t) => t.status === TASK_STATUS.TODO).length,
      inProgress: tasksInScope.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length,
      review: tasksInScope.filter((t) => t.status === TASK_STATUS.IN_REVIEW).length,
      revision: tasksInScope.filter((t) => t.status === TASK_STATUS.REVISION_REQUIRED).length,
      completed: tasksInScope.filter((t) => t.status === TASK_STATUS.COMPLETED).length,
      blocked: tasksInScope.filter((t) => t.status === TASK_STATUS.BLOCKED).length,
      cancelled: tasksInScope.filter((t) => t.status === TASK_STATUS.CANCELLED).length,
      overdue: tasksInScope.filter(isOverdue).length,
    };

    return ok({
      projects,
      tasks,
      completionRate: progressPercent(tasks.completed, tasks.total),
      filters: f,
    });
  },

  /**
   * Project progress table.
   */
  async projectReport(filters = {}) {
    const f = normalizeFilters(filters);
    const bounds = dateRangeBounds(f.dateRange, f.dateFrom, f.dateTo);

    const tasksInScope = applyCommonFilters(mockTasks, f, bounds);

    // If the user picked a specific project, only return that row.
    const projects =
      f.projectId && f.projectId !== 'all'
        ? mockProjects.filter((p) => p.id === f.projectId)
        : mockProjects;

    const rows = buildProjectRows(tasksInScope, projects).sort(
      (a, b) => b.open - a.open || b.overdue - a.overdue,
    );

    return ok({ rows, total: rows.length, filters: f });
  },

  /**
   * Task status distribution for the donut chart + status table.
   */
  async taskStatusDistribution(filters = {}) {
    const f = normalizeFilters(filters);
    const bounds = dateRangeBounds(f.dateRange, f.dateFrom, f.dateTo);
    const tasksInScope = applyCommonFilters(mockTasks, f, bounds);

    const distribution = buildStatusDistribution(tasksInScope);
    const total = tasksInScope.length;

    return ok({
      total,
      distribution,
      filters: f,
    });
  },

  /**
   * Developer workload report.
   */
  async developerReport(filters = {}) {
    const f = normalizeFilters(filters);
    const bounds = dateRangeBounds(f.dateRange, f.dateFrom, f.dateTo);

    const tasksInScope = applyCommonFilters(mockTasks, f, bounds);
    const rows = buildDeveloperRows(tasksInScope, mockUsers).sort(
      (a, b) => b.openTasks - a.openTasks || b.overdue - a.overdue,
    );

    return ok({ rows, total: rows.length, filters: f });
  },

  /**
   * Review queue — pending reviews + counters per status.
   */
  async reviewReport(filters = {}) {
    const f = normalizeFilters(filters);
    const bounds = dateRangeBounds(f.dateRange, f.dateFrom, f.dateTo);

    const reviews = mockReviews.filter((r) => {
      if (f.projectId && f.projectId !== 'all' && r.projectId !== f.projectId) return false;
      if (f.developerId && f.developerId !== 'all' && r.assigneeId !== f.developerId) return false;
      if (!inRange(r.submittedAt, bounds) && !inRange(r.updatedAt, bounds)) return false;
      return true;
    });

    const queue = buildReviewQueue(reviews);
    const counts = {
      submitted: reviews.filter((r) => r.status === REVIEW_STATUS.SUBMITTED).length,
      inReview: reviews.filter((r) => r.status === REVIEW_STATUS.IN_REVIEW).length,
      approved: reviews.filter((r) => r.status === REVIEW_STATUS.APPROVED).length,
      revisionRequired: reviews.filter((r) => r.status === REVIEW_STATUS.REVISION_REQUIRED).length,
      resubmitted: reviews.filter((r) => r.status === REVIEW_STATUS.RESUBMITTED).length,
    };

    // Trim the queue to the longest 12 so the page stays manageable;
    // counters above still reflect the full set.
    const topQueue = queue.slice(0, 12);

    return ok({
      counts,
      queueLength: queue.length,
      queue: topQueue,
      filters: f,
    });
  },

  /**
   * Deadline report — overdue, due today, due this week.
   */
  async deadlineReport(filters = {}) {
    const f = normalizeFilters(filters);
    const bounds = dateRangeBounds(f.dateRange, f.dateFrom, f.dateTo);
    const tasksInScope = applyCommonFilters(mockTasks, f, bounds);

    const buckets = buildDeadlineBuckets(tasksInScope);
    return ok({ ...buckets, filters: f });
  },

  /**
   * Activity breakdown — counts per category + per action, restricted
   * to the date/project/developer scope the user picked.
   */
  async activityReport(filters = {}) {
    const f = normalizeFilters(filters);
    const bounds = dateRangeBounds(f.dateRange, f.dateFrom, f.dateTo);

    const entries = mockActivity.filter((entry) => {
      if (f.projectId && f.projectId !== 'all' && entry.projectId !== f.projectId) return false;
      if (f.developerId && f.developerId !== 'all' && entry.actorId !== f.developerId) return false;
      if (!inRange(entry.createdAt, bounds)) return false;
      return true;
    });

    return ok({ ...buildActivityBreakdown(entries), filters: f });
  },

  /**
   * Completion trend for the line chart (last 14 days of completions).
   */
  async completionTrend(filters = {}) {
    const f = normalizeFilters(filters);
    const bounds = dateRangeBounds(f.dateRange, f.dateFrom, f.dateTo);
    const tasksInScope = applyCommonFilters(mockTasks, f, bounds);

    return ok({
      points: buildCompletionTrend(tasksInScope, 14),
      filters: f,
    });
  },

  /**
   * Filter dropdown options — projects + developers are derived from
   * the authoritative mock datasets.
   */
  async filterOptions() {
    const projects = mockProjects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      status: p.status,
    }));

    const developers = mockUsers
      .filter((u) => u.role === 'DEVELOPER' || u.role === 'TEAM_LEAD')
      .map((u) => ({ id: u.id, name: u.name, role: u.role, title: u.title }));

    return ok({
      projects,
      developers,
      statuses: Object.values(TASK_STATUS),
      priorities: Object.values(TASK_PRIORITY),
    });
  },

  /**
   * Compute every report at once. Used by the page so the user sees
   * one loading state and all sections update together.
   */
  async fullReport(filters = {}) {
    const [
      overview,
      projectReport,
      statusDistribution,
      developerReport,
      reviewReport,
      deadlineReport,
      activityReport,
      completionTrend,
    ] = await Promise.all([
      this.overview(filters),
      this.projectReport(filters),
      this.taskStatusDistribution(filters),
      this.developerReport(filters),
      this.reviewReport(filters),
      this.deadlineReport(filters),
      this.activityReport(filters),
      this.completionTrend(filters),
    ]);

    return ok({
      overview: overview.data,
      projectReport: projectReport.data,
      statusDistribution: statusDistribution.data,
      developerReport: developerReport.data,
      reviewReport: reviewReport.data,
      deadlineReport: deadlineReport.data,
      activityReport: activityReport.data,
      completionTrend: completionTrend.data,
    });
  },
};

export default reportService;
