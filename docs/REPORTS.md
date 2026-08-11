# PCT — Reports System

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Document Type:** Reports & Analytics System Specification
**Status:** Active Development
**Version:** 1.0

---

# 1. Purpose

The Reports System provides internal reporting and operational visibility across PCT.

Reports should help Permetheon understand:

```text
What work is being done?
Who is working on what?
What has been completed?
What is pending?
What is delayed?
What is waiting for review?
What projects are active?
What workload exists?
```

The Reports System is intended for **operational visibility**, not as a replacement for a dedicated BI platform.

---

# 2. Core Principle

> **Reports must be generated from authoritative application data stored in MySQL.**

The frontend must not calculate authoritative business metrics independently.

```text
MySQL
   ↓
Express.js
   ↓
Report Queries / Services
   ↓
React
   ↓
Report UI
```

---

# 3. Reporting Scope

Initial reporting covers:

```text
Projects
Tasks
Developers
Task Status
Task Priority
Reviews
Completion
Deadlines
Activity
Workload
```

Future reporting may include:

```text
Time Tracking
Performance Metrics
Client Metrics
Financial Metrics
Advanced Analytics
```

These are not V1 requirements.

---

# 4. Report Categories

Initial report categories:

```text
1. Overview Report
2. Project Report
3. Task Report
4. Developer Report
5. Status Report
6. Review Report
6. Activity Report
7. Deadline Report
8. Workload Report
```

The exact UI may combine related reports.

---

# 5. Reports Dashboard

Recommended route:

```text
/reports
```

The main Reports page should provide a high-level overview.

Possible cards:

```text
Total Projects
Active Projects
Total Tasks
Open Tasks
Completed Tasks
Tasks in Review
Overdue Tasks
Pending Revisions
```

Example:

```text
┌──────────────────────────────────────────┐
│ Reports                                  │
├───────────┬───────────┬──────────────────┤
│ Projects  │ Tasks     │ Completed        │
│ 12        │ 184       │ 126              │
├───────────┼───────────┼──────────────────┤
│ Review    │ Overdue   │ Revision         │
│ 14        │ 9         │ 7                │
└───────────┴───────────┴──────────────────┘
```

---

# 6. Overview Metrics

The overview should calculate metrics from current database state.

Examples:

```text
Total Projects
Active Projects
Completed Projects

Total Tasks
Active Tasks
Completed Tasks
Tasks in Review
Tasks Requiring Revision
Overdue Tasks
```

Metrics should not be manually entered.

---

# 7. Project Reports

Project reports provide project-level visibility.

Possible information:

```text
Project Name
Status
Members
Task Count
Completed Tasks
Open Tasks
Review Tasks
Overdue Tasks
Deadline
Progress
```

Example:

```text
Project: Nova Nail Studio Website & CRM

Tasks: 42
Completed: 28
In Progress: 8
Review: 4
Revision: 2
Progress: 66.7%
```

---

# 8. Project Progress

Project progress may be calculated using task completion.

Concept:

```text
Completed Tasks
---------------- × 100
Total Tasks
```

Example:

```text
28 / 42 × 100 = 66.67%
```

The calculation must be consistent throughout PCT.

---

# 9. Task Reports

Task reports provide detailed task statistics.

Possible metrics:

```text
Total Tasks
Backlog
Assigned
In Progress
Review
Revision Required
Completed
```

Additional filters:

```text
Project
Developer
Priority
Status
Date
Deadline
```

---

# 10. Developer Reports

Developer reports provide workload and task visibility.

Possible information:

```text
Developer
Assigned Tasks
In Progress
Review
Revision
Completed
Overdue
```

Example:

```text
Developer A

Assigned: 14
In Progress: 5
Review: 2
Revision: 1
Completed: 6
Overdue: 0
```

---

# 11. Developer Performance

PCT V1 should avoid presenting simplistic metrics as definitive performance scores.

For example:

```text
Tasks Completed = Productivity
```

is not necessarily valid.

Reports should primarily show operational data.

Future performance metrics must be carefully designed and documented before implementation.

---

# 12. Workload Report

The workload report shows how work is distributed among developers.

Example:

```text
Developer        Open Tasks

Developer A          12
Developer B           8
Developer C          15
Developer D           4
```

This helps identify:

```text
Overloaded Developers
Underutilized Capacity
Uneven Task Distribution
```

---

# 13. Status Report

The Status Report groups tasks by current status.

Example:

```text
BACKLOG              21
ASSIGNED             17
IN_PROGRESS          32
REVIEW                9
REVISION_REQUIRED     6
COMPLETED            84
```

This provides a snapshot of the current development pipeline.

---

# 14. Review Report

The Review Report focuses on tasks awaiting review.

Possible metrics:

```text
Tasks Awaiting Review
Tasks Approved
Tasks Requiring Revision
Review Queue
```

Example:

```text
Review Queue: 9

Oldest Review:
Task #102
Submitted: 2 days ago
Reviewer: Team Lead
```

---

# 15. Review Turnaround

A future report may calculate review turnaround time.

Concept:

```text
Review Completion Time
-
Review Submission Time
```

Example:

```text
Submitted:
14:00

Reviewed:
16:30

Turnaround:
2h 30m
```

This should only be implemented if the database stores reliable timestamps.

---

# 16. Deadline Report

The Deadline Report identifies tasks and projects based on deadline state.

Categories:

```text
Due Today
Due Soon
Overdue
Completed Before Deadline
Completed After Deadline
```

Example:

```text
Overdue Tasks: 7
Due Today: 4
Due This Week: 11
```

---

# 17. Overdue Logic

A task may be considered overdue when:

```text
deadline < current_time
AND
status != COMPLETED
```

The exact rule must remain consistent across dashboard and reports.

---

# 18. Completed On Time

A completed task may be considered on time when:

```text
completed_at <= deadline
```

If `completed_at` is not available, the report must not invent completion timing.

---

# 19. Activity Report

The Activity Report summarizes important system activity.

Possible filters:

```text
User
Project
Task
Activity Type
Date Range
```

Examples:

```text
Tasks Created
Tasks Assigned
Status Changes
Reviews
Comments
Files Uploaded
Projects Updated
```

Detailed activity behavior:

```text
ACTIVITY_LOG.md
```

---

# 20. Date Filters

Reports should support useful date ranges.

Initial options:

```text
Today
Yesterday
Last 7 Days
Last 30 Days
This Month
Custom Range
```

Date filtering must be performed by the backend/database.

---

# 21. Project Filter

Reports may be filtered by project.

Example:

```text
Project:
[ All Projects ▼ ]
```

When selected:

```text
Only records related to that project
```

should be included.

---

# 22. Developer Filter

Reports may be filtered by developer.

Example:

```text
Developer:
[ All Developers ▼ ]
```

This allows team leads to inspect individual workload.

---

# 23. Status Filter

Task-based reports may support:

```text
All
Backlog
Assigned
In Progress
Review
Revision Required
Completed
```

---

# 24. Priority Filter

If tasks contain priority, reports may filter by:

```text
LOW
MEDIUM
HIGH
URGENT
```

Only priorities actually supported by the Task System should be used.

---

# 25. Combined Filters

Filters should work together.

Example:

```text
Project:
Nova Nail Studio

Developer:
Developer A

Status:
IN_PROGRESS

Date:
Last 30 Days
```

The backend should apply all filters together.

---

# 26. Report Query Architecture

Reports should use dedicated backend services.

Recommended:

```text
server/
├── controllers/
│   └── reportController.js
│
├── routes/
│   └── reportRoutes.js
│
└── services/
    └── reportService.js
```

Reports should not contain large SQL queries directly inside route handlers.

---

# 27. Report API

Initial API structure may include:

```text
GET /api/reports/overview
GET /api/reports/projects
GET /api/reports/tasks
GET /api/reports/developers
GET /api/reports/reviews
GET /api/reports/activity
GET /api/reports/deadlines
GET /api/reports/workload
```

Exact endpoint definitions belong in:

```text
API.md
```

---

# 28. Overview API

Example:

```text
GET /api/reports/overview
```

Conceptual response:

```json
{
  "success": true,
  "data": {
    "projects": {
      "total": 12,
      "active": 8,
      "completed": 4
    },
    "tasks": {
      "total": 184,
      "open": 58,
      "review": 9,
      "completed": 126,
      "overdue": 7
    }
  }
}
```

The actual response structure must follow project API conventions.

---

# 29. Report Authorization

Reports may contain sensitive internal operational information.

Access must be role-controlled.

Example:

```text
Admin
    ↓
Full Reports

Team Lead
    ↓
Team / Project Reports

Developer
    ↓
Own / Authorized Reports
```

The exact permission matrix must follow the authentication and developer system.

---

# 30. Developer Report Privacy

A developer should not automatically receive access to all team analytics.

For example:

```text
Developer A
```

should not automatically be able to inspect private operational data belonging to:

```text
Developer B
```

unless the role/permission model allows it.

---

# 31. Backend Authorization

Frontend route protection is not sufficient.

Incorrect:

```text
React hides Reports page
```

Correct:

```text
React hides Reports page
        +
Express verifies permission
```

The backend remains authoritative.

---

# 32. Report Data Accuracy

Reports must use authoritative database values.

Do not:

```text
Store manually calculated totals
Hardcode statistics
Trust frontend calculations
Duplicate database state unnecessarily
```

Prefer:

```text
MySQL Query
   ↓
Calculated Result
   ↓
Express
   ↓
React
```

---

# 33. Cached Reports

PCT V1 does not require a dedicated analytics cache.

For the initial internal system:

```text
MySQL
   ↓
Express
   ↓
React
```

is sufficient.

Caching may be introduced later if report queries become expensive.

---

# 34. Report Performance

Reports should avoid unnecessarily expensive database queries.

Use:

```text
Indexes
Aggregations
Pagination
Date Filters
Limited Result Sets
Efficient Joins
```

Do not load all tasks into React and calculate reports in the browser.

---

# 35. Pagination

Detailed report tables should support pagination.

Example:

```text
Page 1
20 records

Page 2
20 records
```

The backend should handle pagination.

---

# 36. Report Sorting

Report tables may support sorting by:

```text
Name
Date
Status
Priority
Task Count
Completion
Deadline
```

Sorting should be performed server-side for large datasets.

---

# 37. Report Charts

PCT may use simple charts where they improve understanding.

Possible charts:

```text
Task Status Distribution
Developer Workload
Project Progress
Completion Trend
Review Queue
```

Charts are optional presentation layers.

The underlying numbers must come from the backend.

---

# 38. Chart Principle

Do not create charts simply because a chart looks impressive.

A chart should answer a useful question.

Good:

```text
How many tasks are currently in each status?
```

Good chart:

```text
Status Distribution
```

Bad:

```text
Random decorative graph
```

---

# 39. Tables

Reports should provide tables where exact information matters.

Example:

```text
| Task | Developer | Status | Deadline |
|------|-----------|--------|----------|
| #101 | Dev A     | Review | Aug 12   |
| #102 | Dev B     | Active | Aug 14   |
```

Charts and tables may complement each other.

---

# 40. Empty Report State

If no data matches the filters:

```text
No data found for the selected filters.
```

Do not display:

```text
0
```

without context when a more useful empty state is possible.

---

# 41. Loading State

Reports must provide a loading state.

Example:

```text
Loading report...
```

For larger reports, skeleton loaders may be used.

---

# 42. Error State

If a report fails:

```text
Unable to load report.
Please try again.
```

The failure of one report should not unnecessarily break the entire dashboard.

---

# 43. Export

PCT may support report export.

Initial recommended formats:

```text
CSV
```

PDF/Excel exports are optional future features.

Export functionality must use the same authorization rules as normal report access.

---

# 44. CSV Export

Example:

```text
GET /api/reports/tasks/export?format=csv
```

The backend should generate the export from authoritative database data.

Do not export data directly from an untrusted frontend table state.

---

# 45. Export Security

Exports must respect:

```text
User Permissions
Project Permissions
Date Filters
Selected Filters
Data Visibility
```

A user must never be able to export data they cannot normally access.

---

# 46. Report File Generation

If exports are generated as files, temporary files should be handled carefully.

Do not permanently fill the 50GB Hostinger storage with unnecessary report exports.

Temporary exports should be cleaned up according to the file-system strategy.

---

# 47. Report Refresh

Reports should provide a refresh mechanism.

Example:

```text
[ Refresh ]
```

After important task/project changes, the relevant report can be refreshed.

Avoid unnecessary automatic refresh loops.

---

# 48. Real-Time Reporting

Real-time reporting is not required for V1.

Do not introduce:

```text
WebSockets
Socket.io
Server-Sent Events
```

only for reports.

Normal API refresh is sufficient.

---

# 49. Dashboard vs Reports

The Dashboard provides quick operational information.

Reports provide deeper analysis.

```text
Dashboard
    ↓
"What needs attention now?"

Reports
    ↓
"What is happening across the system?"
```

Example:

```text
Dashboard:
9 tasks waiting for review

Reports:
9 waiting for review
3 reviewers
Average review age
Project distribution
```

---

# 50. Reports vs Activity Logs

Activity Logs provide raw historical events.

Reports summarize application data.

```text
Activity Log
    ↓
Individual events

Reports
    ↓
Aggregated information
```

Reports should not replace the Activity Log.

---

# 51. Reports vs Developer System

Developer System answers:

```text
"What do I need to work on?"
```

Reports answer:

```text
"What is happening with the work?"
```

These systems should complement each other.

---

# 52. Recommended Frontend Structure

```text
client/src/
└── components/
    └── reports/
        ├── ReportCard.jsx
        ├── ReportFilters.jsx
        ├── ReportTable.jsx
        ├── ProjectReport.jsx
        ├── TaskReport.jsx
        ├── DeveloperReport.jsx
        ├── ReviewReport.jsx
        ├── WorkloadReport.jsx
        └── DeadlineReport.jsx
```

Recommended service:

```text
client/src/services/reportService.js
```

---

# 53. Reports Page

Recommended route:

```text
/reports
```

Possible layout:

```text
Reports
│
├── Overview
├── Projects
├── Tasks
├── Developers
├── Reviews
├── Workload
├── Deadlines
└── Activity
```

Tabs or separate pages may be used depending on UI requirements.

---

# 54. Report Filters UI

Recommended filter area:

```text
┌───────────────────────────────────────────┐
│ Project   Developer   Status   Date       │
│ [All]     [All]       [All]    [30 Days] │
│                                           │
│                     [Apply] [Reset]       │
└───────────────────────────────────────────┘
```

Filters should be clear and easy to reset.

---

# 55. Reset Filters

A `Reset` action should restore the default report state.

Example:

```text
Project = All
Developer = All
Status = All
Date = Default
```

---

# 56. Report Date Handling

All report date calculations must use a consistent timezone.

The backend should be responsible for interpreting date ranges.

Do not let different frontend pages use different timezone logic.

---

# 57. Report Data Validation

Backend report services should handle:

```text
Invalid dates
Invalid project IDs
Invalid developer IDs
Invalid statuses
Invalid pagination
Invalid sorting fields
```

Do not directly inject user-supplied sorting or SQL fragments into database queries.

---

# 58. SQL Safety

Never build report SQL like:

```js
const query = "SELECT * FROM tasks WHERE status = '" + status + "'";
```

Use parameterized queries.

Also whitelist dynamic fields such as:

```text
Sort Column
Sort Direction
Status
Report Type
```

---

# 59. Report Auditability

Generating a normal report does not necessarily need an Activity Log.

However, sensitive operations such as:

```text
Large Data Export
Administrative Report Export
```

may be logged if required by internal policy.

---

# 60. Initial Report Priority

V1 implementation priority:

```text
1. Overview
2. Task Report
3. Project Report
4. Developer Workload
5. Review Report
6. Deadline Report
7. Activity Report
```

Advanced analytics should come later.

---

# 61. V1 Non-Goals

Do NOT implement initially:

```text
AI-generated analytics
Predictive analytics
Complex BI dashboards
External analytics integrations
Google Analytics
Power BI integration
Real-time analytics infrastructure
Machine-learning performance scoring
```

PCT should first establish accurate operational reporting.

---

# 62. Testing Checklist

```text
[ ] Overview metrics are accurate
[ ] Project report works
[ ] Task report works
[ ] Developer report works
[ ] Review report works
[ ] Deadline report works
[ ] Activity report works
[ ] Filters work
[ ] Combined filters work
[ ] Date ranges work
[ ] Sorting works
[ ] Pagination works
[ ] Empty state works
[ ] Loading state works
[ ] Error state works
[ ] Authorization works
[ ] Unauthorized reports are blocked
[ ] Export respects permissions
[ ] Large datasets remain performant
```

---

# 63. Security Checklist

```text
[ ] Authentication required
[ ] Backend authorization enforced
[ ] User scope enforced
[ ] Project scope enforced
[ ] SQL queries parameterized
[ ] Dynamic sorting whitelisted
[ ] Export permissions enforced
[ ] Sensitive data excluded
[ ] No frontend-only security
```

---

# 64. Definition of Done

The Reports System is complete when:

```text
[ ] Reports page exists
[ ] Overview metrics work
[ ] Project reporting works
[ ] Task reporting works
[ ] Developer workload reporting works
[ ] Review reporting works
[ ] Deadline reporting works
[ ] Filters work
[ ] Pagination works
[ ] Authorization works
[ ] Error/loading/empty states work
[ ] Database queries are optimized
[ ] API endpoints documented
[ ] Export implemented if included in scope
[ ] Production build succeeds
```

---

# 65. Final Principle

> **PCT Reports should provide accurate, actionable operational visibility using data already stored in MySQL. Reports must remain simple, permission-aware, performant, and directly connected to the real state of projects and development work.**

The goal is not to build a complicated analytics platform.

The goal is to let Permetheon quickly understand:

```text
Projects
   ↓
Tasks
   ↓
Developers
   ↓
Progress
   ↓
Reviews
   ↓
Deadlines
   ↓
Completed Work
```

without relying on manual spreadsheets or disconnected reports.
