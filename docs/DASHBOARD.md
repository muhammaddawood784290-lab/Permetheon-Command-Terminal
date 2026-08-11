# PCT — Dashboard Specification

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Document Type:** Dashboard Specification
**Status:** Active
**Version:** 1.0

---

# 1. Purpose

The PCT Dashboard is the primary landing page after authentication.

Its purpose is to provide a fast operational overview of Permetheon's internal development activity.

The dashboard should answer:

* What is happening?
* What needs attention?
* What is currently in progress?
* What is overdue?
* What requires review?
* What has recently changed?
* What is the current project/task workload?

The dashboard is an operational control center, not a generic analytics template.

---

# 2. Dashboard Access

The dashboard requires authentication.

Unauthenticated users:

```text
/dashboard
     ↓
401 / Not Authenticated
     ↓
/login
```

Authenticated users:

```text
/login
   ↓
/dashboard
```

---

# 3. Primary Dashboard Route

Frontend route:

```text
/dashboard
```

Backend data should come from appropriate API endpoints.

The frontend must not connect directly to MySQL.

---

# 4. Dashboard Architecture

```text
React Dashboard
       │
       ├── AuthContext
       │
       ├── Dashboard Components
       │
       └── Dashboard Services
              │
              ▼
        Express API
              │
              ▼
            MySQL
```

---

# 5. Dashboard Layout

Recommended layout:

```text
┌──────────────────────────────────────────────────────┐
│ Header / Top Navigation                              │
├──────────────┬───────────────────────────────────────┤
│              │                                       │
│ Sidebar      │ Dashboard                             │
│              │                                       │
│ Navigation   │ Overview Cards                        │
│              │                                       │
│              │ Task / Project Overview               │
│              │                                       │
│              │ Recent Activity                       │
│              │                                       │
│              │ Pending Actions                        │
│              │                                       │
└──────────────┴───────────────────────────────────────┘
```

The exact visual design may evolve, but the information hierarchy should remain clear.

---

# 6. Dashboard Sections

The dashboard should contain the following major areas:

```text
1. Welcome / Header
2. Overview Statistics
3. Task Overview
4. Project Overview
5. Pending Actions
6. Recent Activity
7. Notifications
8. Quick Actions
```

Not every section must appear identically for every role.

---

# 7. Welcome Section

The top of the dashboard should identify the authenticated user.

Example:

```text
Good evening, Ahmed.
Here's what's happening across PCT.
```

The exact greeting can be dynamic.

Do not make the greeting the primary information on the page.

Operational information should remain the priority.

---

# 8. Overview Statistics

The dashboard should provide high-level metrics.

Potential cards:

```text
Total Projects
Active Projects
Total Tasks
Tasks In Progress
Tasks In Review
Completed Tasks
Overdue Tasks
```

Only show metrics relevant to the authenticated user's role.

---

# 9. Statistic Card Structure

A statistic card may contain:

```text
Title
Current Value
Optional Comparison
Optional Icon
Optional Supporting Text
```

Example:

```text
┌─────────────────────┐
│ Tasks In Review     │
│                     │
│ 12                  │
│ Awaiting approval   │
└─────────────────────┘
```

Cards should be scannable.

Avoid excessive visual decoration.

---

# 10. Dashboard Metrics

Initial recommended metrics:

### Projects

```text
Total Projects
Active Projects
Completed Projects
```

### Tasks

```text
Total Tasks
Backlog
Assigned
In Progress
Review
Completed
Revision Required
Overdue
```

Not all metrics need to be displayed as separate cards.

The final UI should avoid overwhelming users.

---

# 11. Task Overview

The dashboard should provide a quick view of task distribution.

Example:

```text
BACKLOG          8
ASSIGNED         5
IN_PROGRESS     14
REVIEW           7
REVISION         3
COMPLETED       42
```

A visual representation may be used.

Possible implementations:

* Status cards
* Progress bars
* Compact chart
* Status distribution list

Do not introduce a charting library unless actually required.

Simple UI components should be preferred initially.

---

# 12. Task Priority

Tasks may have priorities such as:

```text
LOW
MEDIUM
HIGH
URGENT
```

Dashboard may highlight:

```text
Urgent Tasks
High Priority Tasks
Overdue Tasks
```

Priority should be visually distinguishable without relying exclusively on color.

---

# 13. Overdue Tasks

Overdue tasks should receive special attention.

Example:

```text
Overdue Tasks
────────────────────────
Fix authentication bug
Due: Yesterday
Assigned: Ahmed

CRM dashboard revision
Due: 2 days ago
Assigned: Bilal
```

Clicking a task should navigate to the task details page.

---

# 14. Pending Actions

The dashboard should identify items requiring action by the current user.

Examples for a developer:

```text
Tasks assigned to you
Tasks requiring updates
Revision requests
Tasks nearing deadline
```

Examples for a team lead:

```text
Tasks waiting for review
Pending approvals
Overdue developer tasks
```

Examples for an admin:

```text
System-level pending items
User management actions
Projects requiring attention
```

---

# 15. Recent Activity

The dashboard should display recent system activity.

Example:

```text
Ahmed submitted Task #102 for review
5 minutes ago

Sara assigned Task #105 to Bilal
21 minutes ago

Project X was created
1 hour ago
```

Activity data must come from the activity system defined in:

```text
ACTIVITY_LOG.md
```

The dashboard must not create duplicate activity records merely because it displays them.

---

# 16. Recent Activity Limit

The dashboard should show a limited number of recent events.

Example:

```text
Latest 5
Latest 10
```

Do not load the entire activity history onto the dashboard.

A "View All Activity" action may navigate to:

```text
/activity
```

---

# 17. Notifications

Notifications should be displayed separately from activity.

Example:

```text
Notifications

Task #102 is ready for review.
10 minutes ago

Task #88 was returned for revision.
1 hour ago
```

Notifications should indicate whether they are read/unread where supported.

---

# 18. Notification Count

The header may display an unread notification count.

Example:

```text
🔔 4
```

The count should come from the backend.

Do not hardcode notification counts.

---

# 19. Quick Actions

The dashboard may provide quick actions based on permissions.

Examples:

```text
Create Task
Create Project
Assign Task
Review Tasks
Add Developer
View Reports
```

Only show actions the authenticated user is allowed to perform.

---

# 20. Role-Based Dashboard

Dashboard behavior depends on role.

Initial roles:

```text
ADMIN
TEAM_LEAD
DEVELOPER
```

---

# 21. ADMIN Dashboard

Admin should receive the broadest operational overview.

Recommended information:

```text
Total Users
Active Developers
Total Projects
Active Projects
Total Tasks
Tasks In Progress
Tasks In Review
Overdue Tasks
Recent Activity
System Notifications
```

Admin can access broader system information than developers.

---

# 22. TEAM_LEAD Dashboard

Team leads should focus on project and developer operations.

Recommended information:

```text
Managed Projects
Active Tasks
Tasks In Review
Overdue Tasks
Developer Workload
Pending Reviews
Recent Activity
Notifications
```

Team leads should not necessarily receive unrelated administrative information.

---

# 23. DEVELOPER Dashboard

Developers should see their personal workload first.

Recommended information:

```text
My Tasks
In Progress
Awaiting Review
Revision Required
Completed
Overdue
Upcoming Deadlines
Recent Activity
Notifications
```

The developer dashboard should prioritize actionable personal information.

---

# 24. Personal Task Summary

For developers, a dedicated section may display:

```text
My Tasks
──────────────────────
In Progress      4
Awaiting Review  2
Revision         1
Overdue          1
Completed       18
```

These values must be calculated from actual database records.

---

# 25. Project Overview

The dashboard may display active projects.

Example:

```text
Active Projects

Project A        72%
Project B        48%
Project C        91%
```

Project progress must be derived from actual task/project data.

Do not manually store fake percentage values in the frontend.

---

# 26. Project Progress

If project progress is based on tasks, a consistent calculation must be used.

Example:

```text
Completed Tasks
---------------------- × 100
Total Project Tasks
```

The exact business rule should follow the project's database/business logic.

If progress is manually managed, the dashboard must use the project's stored progress value.

Do not mix both approaches without a defined rule.

---

# 27. Upcoming Deadlines

The dashboard may display upcoming task deadlines.

Example:

```text
Upcoming Deadlines

Today
Fix CRM authentication

Tomorrow
Complete dashboard revision

Friday
Submit frontend review
```

Sort by nearest deadline first.

---

# 28. Empty States

Every dashboard section that can have no data should have a useful empty state.

Example:

```text
No pending reviews.
You're all caught up.
```

Avoid blank spaces that make the page appear broken.

---

# 29. Loading State

When dashboard data is loading:

```text
Dashboard
   ↓
Loading
   ↓
Skeleton / Loading State
   ↓
Dashboard Data
```

Do not show fake values while the API is loading.

---

# 30. Error State

If a dashboard API request fails, show a clear message.

Example:

```text
Unable to load dashboard data.

Try again
```

A failure in one non-critical dashboard widget should not necessarily make the entire dashboard unusable.

---

# 31. Dashboard API Strategy

Dashboard data may be retrieved through:

```text
GET /api/dashboard
```

or through dedicated endpoints where appropriate.

The final API structure must remain consistent with `API.md`.

Avoid creating excessive API requests for every small statistic.

---

# 32. Recommended Dashboard Response

A consolidated dashboard response may look conceptually like:

```json
{
  "success": true,
  "data": {
    "stats": {},
    "tasks": {},
    "projects": [],
    "pendingActions": [],
    "recentActivity": [],
    "notifications": []
  }
}
```

The exact response structure should be finalized according to the backend implementation.

---

# 33. Dashboard Performance

The dashboard is a frequently visited page.

Avoid:

```text
50+ API requests
Large unpaginated queries
Full activity history
Full task history
Full notification history
```

Prefer efficient queries and limited datasets.

---

# 34. Dashboard Refresh

Dashboard data may be refreshed:

* On page load
* After relevant user actions
* Manually
* Through controlled polling if required

Do not implement aggressive polling by default.

There is no need to constantly request the server every few seconds unless a real-time requirement is introduced.

---

# 35. Real-Time Features

Real-time updates are NOT required initially.

Do not introduce:

```text
WebSockets
Socket.IO
Server-Sent Events
```

unless explicitly requested.

Initial implementation should use normal API requests.

---

# 36. Dashboard Navigation

Dashboard elements should link to their relevant modules.

Examples:

```text
Overdue Tasks
     ↓
/tasks?filter=overdue

Tasks In Review
     ↓
/tasks?status=REVIEW

Active Projects
     ↓
/projects?status=ACTIVE

Recent Activity
     ↓
/activity
```

Use existing route conventions.

---

# 37. Dashboard Security

Dashboard data must respect permissions.

A developer must not receive sensitive admin-level data simply because the frontend hides it.

Backend must determine what data the authenticated user can access.

---

# 38. Data Filtering by User

For developer accounts, queries should be restricted to relevant records.

Example:

```text
Developer
   ↓
Dashboard API
   ↓
Only permitted projects/tasks/activity
```

Do not fetch all system data and hide it using React.

---

# 39. Data Filtering by Team Lead

Team leads should receive data relevant to their permitted projects/team scope.

The exact permission boundaries must follow the authorization architecture.

---

# 40. Admin Data Scope

Admins may receive system-wide operational data according to their permissions.

Even admin-level queries should avoid unnecessary large dataset loads.

---

# 41. Dashboard Components

Recommended frontend structure:

```text
client/src/
└── components/
    └── dashboard/
        ├── DashboardHeader.jsx
        ├── StatCard.jsx
        ├── TaskOverview.jsx
        ├── ProjectOverview.jsx
        ├── PendingActions.jsx
        ├── RecentActivity.jsx
        ├── NotificationSummary.jsx
        ├── UpcomingDeadlines.jsx
        └── QuickActions.jsx
```

Actual structure may be adjusted to match the existing project.

---

# 42. Dashboard Page

Recommended page:

```text
client/src/pages/dashboard/
└── Dashboard.jsx
```

The page should primarily compose dashboard components.

Avoid putting every dashboard query and every UI section into one giant component.

---

# 43. Dashboard Service

Recommended:

```text
client/src/services/dashboardService.js
```

Responsibilities:

* Request dashboard data
* Handle API communication
* Return structured data to the dashboard

Do not place raw API requests throughout dashboard components.

---

# 44. Backend Dashboard Structure

Recommended:

```text
server/
├── routes/
│   └── dashboardRoutes.js
│
├── controllers/
│   └── dashboardController.js
│
└── services/
    └── dashboardService.js
```

The exact implementation should follow the existing backend structure.

---

# 45. Dashboard Query Principles

Dashboard queries should:

* Select only required fields
* Use indexed columns where appropriate
* Use pagination/limits for lists
* Avoid unnecessary joins
* Respect user permissions
* Avoid N+1 queries
* Return only the data required by the UI

---

# 46. Dashboard Activity

Dashboard activity is read-only.

The dashboard must never directly modify activity records.

Activity creation belongs to the relevant backend business operation.

---

# 47. Dashboard Notifications

Notification display is read-only unless a notification interaction explicitly supports:

```text
Mark as read
Mark all as read
```

Those actions must use backend endpoints.

---

# 48. Responsive Behavior

The dashboard should work on:

```text
Desktop
Laptop
Tablet
```

Primary optimization target:

```text
Desktop / Laptop
```

Cards should reorganize naturally on smaller screens.

Do not create a completely separate mobile dashboard unless required.

---

# 49. Visual Design Principles

The dashboard should feel like an internal command center.

Prioritize:

```text
Clarity
Information hierarchy
Fast scanning
Low visual noise
Consistent spacing
Readable typography
Clear status indicators
```

Avoid excessive:

* Gradients
* Animations
* Decorative charts
* Huge hero sections
* Unnecessary cards

The dashboard is for work, not a marketing website.

---

# 50. Accessibility

Dashboard UI should use semantic and accessible elements.

Examples:

* Buttons for actions
* Links for navigation
* Accessible labels
* Keyboard navigation
* Meaningful headings
* Sufficient text contrast

Do not rely exclusively on color to communicate status.

---

# 51. Dashboard State Model

Dashboard should account for:

```text
INITIAL_LOADING
SUCCESS
PARTIAL_ERROR
FULL_ERROR
EMPTY
```

Where practical, individual widgets should fail gracefully.

---

# 52. Dashboard Caching

Do not introduce a complex caching system initially.

Use normal React state and API requests.

Caching can be introduced later if actual performance requirements justify it.

---

# 53. Dashboard Scope

Initial dashboard scope:

```text
Authentication-aware
Role-aware
Task overview
Project overview
Pending actions
Recent activity
Notifications
Upcoming deadlines
Quick actions
```

---

# 54. Out of Scope Initially

Do NOT implement unless explicitly requested:

```text
AI-generated insights
Predictive analytics
Real-time WebSockets
Advanced BI dashboards
External analytics integrations
Third-party chart platforms
Machine learning
Automated productivity scoring
Employee surveillance
```

---

# 55. Dashboard Completion Criteria

The dashboard is considered complete when:

```text
[ ] Authenticated users can access /dashboard
[ ] Unauthenticated users are redirected to /login
[ ] Dashboard data comes from Express API
[ ] Dashboard data comes from MySQL
[ ] No business data is hardcoded
[ ] Role-based visibility works
[ ] Task overview works
[ ] Project overview works
[ ] Pending actions work
[ ] Recent activity works
[ ] Notifications work
[ ] Loading states exist
[ ] Error states exist
[ ] Empty states exist
[ ] Navigation links work
[ ] Backend authorization is enforced
[ ] No unnecessary API requests exist
[ ] Frontend production build succeeds
[ ] Relevant API endpoints are verified
```

---

# 56. Final Dashboard Principle

> **The PCT Dashboard should tell every user what matters to them right now, without making them dig through the CRM to find it.**

The dashboard is an operational command center — not a decorative analytics page.
