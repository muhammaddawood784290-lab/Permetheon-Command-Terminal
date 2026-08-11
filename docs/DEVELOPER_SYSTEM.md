# PCT — Developer System Specification

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Document Type:** Developer System Specification
**Status:** Active
**Version:** 1.0

---

# 1. Purpose

The Developer System is the core workspace for developers inside PCT.

It allows developers to:

* View assigned work
* Manage their tasks
* Update task status
* View project context
* Upload and access files
* Communicate through task comments
* Submit work for review
* Respond to revision requests
* Track deadlines
* View relevant activity
* Receive notifications

The system should reduce dependency on external task sheets and provide a centralized internal development workflow.

---

# 2. Developer Role

The initial developer role is:

```text
DEVELOPER
```

Developers should only access information permitted by the authorization system.

The backend must enforce permissions.

Frontend visibility alone is not security.

---

# 3. Developer Workspace

Primary developer experience:

```text
┌──────────────────────────────────────────────┐
│ PCT                                          │
├─────────────┬────────────────────────────────┤
│ Dashboard   │                                │
│ My Tasks    │ Developer Workspace            │
│ Projects    │                                │
│ Activity    │                                │
│ Notifications│                               │
│ Profile     │                                │
└─────────────┴────────────────────────────────┘
```

The developer should be able to reach active work quickly.

---

# 4. Developer Dashboard

The developer dashboard should prioritize personal workload.

Recommended sections:

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

See:

```text
DASHBOARD.md
```

for the general dashboard specification.

---

# 5. My Tasks

Primary developer route:

```text
/tasks
```

or the project's established task route.

Developers should see tasks they are authorized to access.

For a normal developer, this primarily means:

```text
Tasks assigned to the developer
Tasks belonging to permitted projects
Relevant completed task history
```

---

# 6. Task List

Each task list item should provide enough information to understand the work without opening the task.

Recommended fields:

```text
Task Title
Project
Status
Priority
Due Date
Updated At
```

Optional:

```text
Assigned By
Last Activity
Comment Count
File Count
```

---

# 7. Task Filters

Developers should be able to filter their tasks.

Initial filters:

```text
All
Backlog
Assigned
In Progress
Review
Revision Required
Completed
Overdue
```

Filtering should be performed through backend queries where appropriate.

Do not download the entire task database and perform all filtering in React.

---

# 8. Task Search

Developers should be able to search accessible tasks.

Search may include:

```text
Task title
Task description
Project name
```

Search must respect authorization.

A developer must never discover an unauthorized task through search.

---

# 9. Task Details

Opening a task should display:

```text
Task Title
Description
Project
Status
Priority
Assigned Developer
Created By
Created At
Updated At
Due Date
Files
Comments
Review Information
Activity
```

The exact visible fields may depend on role and permissions.

---

# 10. Task Status Workflow

Developer workflow:

```text
ASSIGNED
   ↓
IN_PROGRESS
   ↓
REVIEW
   ↓
COMPLETED
```

Revision workflow:

```text
REVIEW
   ↓
REVISION_REQUIRED
   ↓
IN_PROGRESS
   ↓
REVIEW
```

A developer should not arbitrarily mark a task as completed if the workflow requires review approval.

---

# 11. Starting a Task

When a developer starts assigned work:

```text
ASSIGNED
   ↓
IN_PROGRESS
```

The system should record the status change.

An activity log should be created:

```text
TASK_STATUS_CHANGED
```

Metadata should contain relevant old/new state.

---

# 12. Submitting for Review

When development is complete:

```text
IN_PROGRESS
   ↓
REVIEW
```

The developer should submit the task for review.

The system should:

1. Validate the task.
2. Update the task status.
3. Record activity.
4. Notify the appropriate reviewer.

---

# 13. Revision Required

If a reviewer requests changes:

```text
REVIEW
   ↓
REVISION_REQUIRED
```

The developer should be able to see:

* Review feedback
* Reviewer
* Review date
* Required changes

The developer then moves the task back into:

```text
IN_PROGRESS
```

when work resumes.

---

# 14. Review Feedback

Review feedback must be preserved.

Do not overwrite previous review records.

Example:

```text
Review #1
APPROVED / REVISION_REQUIRED
Feedback
Reviewer
Date

Review #2
APPROVED / REVISION_REQUIRED
Feedback
Reviewer
Date
```

This provides historical context.

---

# 15. Task Comments

Developers can comment on tasks they are authorized to access.

Comments should support:

```text
Questions
Progress updates
Technical notes
Clarifications
Review discussions
```

Comments are not replacements for activity logs.

---

# 16. Activity vs Comments

### Activity Log

Records system events.

Example:

```text
Task status changed
Task assigned
File uploaded
Task submitted for review
```

### Comments

Contain human-written communication.

Example:

```text
"I've completed the authentication middleware.
Please review the login flow."
```

These systems must remain separate.

---

# 17. Developer File System

Developers should be able to upload files associated with authorized tasks/projects.

Examples:

```text
ZIP
PDF
Images
Documents
Code archives
Design files
Other approved project files
```

The actual file is stored on Hostinger.

MySQL stores metadata.

---

# 18. File Upload Flow

```text
Developer
    ↓
React
    ↓
Express.js
    ↓
Validate File
    ↓
Save to Hostinger Filesystem
    ↓
Save Metadata to MySQL
    ↓
Create Activity
```

---

# 19. File Metadata

The system should store:

```text
Original Name
Stored Name
File Path
MIME Type
File Size
Uploader
Related Entity
Created At
```

See:

```text
DATABASE.md
```

for database details.

---

# 20. File Access

A developer may access a file only if they have permission to access its related project/task.

Do not expose arbitrary filesystem paths directly to users.

The backend should validate file access.

---

# 21. File Naming

Uploaded files should not rely solely on the original filename.

Use safe generated storage names.

Example:

```text
Original:
final-dashboard.zip

Stored:
a83d9f21-final-dashboard.zip
```

or an equivalent safe unique naming system.

---

# 22. Deadline Management

Tasks may contain:

```text
due_date
```

Developers should see:

```text
Due Today
Due Tomorrow
Upcoming
Overdue
```

Overdue state should be calculated consistently by the backend/business logic.

---

# 23. Overdue Tasks

If:

```text
current_time > due_date
```

and the task is not completed, it may be considered overdue according to the application's exact deadline rule.

The system should not modify the task status merely because it is overdue unless explicitly designed to do so.

Overdue is a condition, not necessarily a task status.

---

# 24. Developer Notifications

Developers should receive notifications for relevant events.

Examples:

```text
Task assigned to you
Task deadline approaching
Task review requested
Task approved
Revision requested
New comment
Task status changed by authorized user
```

Notifications should not expose unauthorized project information.

---

# 25. Developer Activity

Developer activity should be visible where appropriate.

Examples:

```text
You started Task #104
You uploaded a file
You submitted Task #104 for review
Reviewer requested revision
You added a comment
```

Activity records should come from the backend activity system.

---

# 26. Developer Workload

The system may calculate:

```text
Active Tasks
Review Tasks
Revision Tasks
Overdue Tasks
Completed Tasks
```

This information should be derived from actual task records.

Do not manually maintain counters.

---

# 27. Developer Task Ordering

Default task ordering may prioritize:

1. Overdue
2. Urgent
3. High Priority
4. Nearest Deadline
5. Recently Updated

The final sorting rule should remain consistent throughout the application.

---

# 28. Developer Quick Actions

Depending on permissions, developers may have:

```text
Start Task
Update Task
Submit for Review
Upload File
Add Comment
View Project
```

Do not show actions that the backend will reject.

---

# 29. Status Transition Validation

Status changes must be validated by the backend.

Example:

A developer should not be able to send:

```text
COMPLETED → IN_PROGRESS
```

unless that transition is explicitly permitted.

Frontend restrictions are supplementary only.

---

# 30. Permission Rules

Initial developer permissions:

```text
VIEW_ASSIGNED_TASKS
UPDATE_ASSIGNED_TASKS
COMMENT_ON_ASSIGNED_TASKS
UPLOAD_TASK_FILES
SUBMIT_TASK_FOR_REVIEW
VIEW_PERMITTED_PROJECTS
VIEW_RELEVANT_ACTIVITY
VIEW_OWN_NOTIFICATIONS
```

Exact permissions must remain aligned with the authorization system.

---

# 31. Developer Restrictions

A standard developer should NOT be able to:

```text
Delete users
Change global roles
Access system settings
View unrelated projects
Modify another developer's tasks
Approve their own task
Access database credentials
Access arbitrary server files
```

Unless explicitly granted through a higher role/permission.

---

# 32. Self-Approval Prevention

A developer must not be able to approve their own task.

The backend should validate:

```text
task.created_by / assigned_to
        ≠
reviewer_id
```

according to the project's review policy.

---

# 33. Project Context

When viewing a task, developers should be able to access relevant project information.

Example:

```text
Project
Project Description
Project Status
Project Members
Related Tasks
Project Files
```

Only permitted project information should be exposed.

---

# 34. Developer Project Access

A developer's project access should be determined by:

```text
Project Membership
Role
Task Assignment
Backend Authorization
```

Do not rely on frontend route hiding.

---

# 35. Task Ownership

The developer assigned to a task is the primary worker responsible for the task.

Assignment changes must be recorded as activity.

Example:

```text
TASK_ASSIGNED
```

with metadata:

```json
{
  "previous_assignee": 12,
  "new_assignee": 18
}
```

---

# 36. Assignment Changes

A developer should not reassign their own task unless explicitly authorized.

Assignment should normally be controlled by:

```text
ADMIN
TEAM_LEAD
```

according to the authorization model.

---

# 37. Task Editing

Developers may edit fields they are authorized to modify.

Typical developer-editable fields:

```text
Description
Status
Progress-related information
Task comments
Files
```

Fields such as:

```text
Assignee
Project
Priority
Due Date
```

may require higher permissions depending on the business rules.

---

# 38. Task Deletion

Developers should not normally delete tasks.

Task deletion should be restricted to authorized administrative roles.

Where possible, archive/cancel workflows should be preferred over destructive deletion.

---

# 39. Developer Activity Logging

Important developer actions should generate activity records.

Examples:

```text
LOGIN
TASK_STARTED
TASK_UPDATED
TASK_STATUS_CHANGED
TASK_SUBMITTED_FOR_REVIEW
COMMENT_CREATED
FILE_UPLOADED
```

Avoid logging every minor UI interaction.

---

# 40. Developer API Interaction

The React application communicates with Express.

Example:

```text
React
  ↓
GET /api/tasks/my
  ↓
Express
  ↓
Authorization
  ↓
MySQL
```

For status changes:

```text
React
  ↓
PATCH /api/tasks/:id/status
  ↓
Express
  ↓
Validate User
  ↓
Validate Transition
  ↓
Update MySQL
  ↓
Create Activity
  ↓
Create Notification if required
```

---

# 41. Atomic Task Operations

Operations involving multiple records should use transactions when required.

Example:

```text
Update Task
+
Create Activity
+
Create Notification
```

These should remain consistent.

---

# 42. Developer API Security

Every developer-related API endpoint must verify:

```text
Authentication
+
Authorization
+
Resource Ownership / Access
+
Input Validation
```

Do not rely on route names or frontend restrictions.

---

# 43. Developer Error Handling

Expected errors should be clear.

Examples:

```text
401
Not authenticated

403
You do not have permission to perform this action.

404
Task not found.

422
Invalid task status transition.

500
Internal server error.
```

Do not expose raw SQL/database errors to the frontend.

---

# 44. Developer UI States

Task screens should support:

```text
Loading
Loaded
Empty
Error
Unauthorized
Not Found
```

Actions should provide feedback after successful operations.

---

# 45. Prevent Duplicate Actions

Buttons such as:

```text
Submit for Review
Upload
Save
Comment
```

should prevent accidental duplicate submissions while the request is processing.

Example:

```text
Submit for Review
       ↓
Submitting...
       ↓
Success
```

---

# 46. Unsaved Changes

If a developer is editing a task/comment and navigates away, the application should avoid silently losing entered information where practical.

The exact implementation can be lightweight.

Do not introduce unnecessary complexity.

---

# 47. Developer Search and Filtering

Search/filtering must respect permissions.

Example:

```text
Developer searches:
"authentication"
```

The backend should return only accessible tasks/projects.

---

# 48. Developer Performance

Developer pages should avoid:

```text
Large unpaginated task lists
Repeated API requests
Full activity history requests
Full project dataset requests
```

Use:

```text
Pagination
Filtering
Limited queries
Indexed database columns
```

---

# 49. Developer System Components

Recommended frontend structure:

```text
client/src/
├── pages/
│   ├── dashboard/
│   │   └── Dashboard.jsx
│   │
│   ├── tasks/
│   │   ├── Tasks.jsx
│   │   └── TaskDetails.jsx
│   │
│   └── projects/
│       └── ProjectDetails.jsx
│
├── components/
│   ├── tasks/
│   │   ├── TaskCard.jsx
│   │   ├── TaskList.jsx
│   │   ├── TaskStatus.jsx
│   │   ├── TaskFilters.jsx
│   │   ├── TaskComments.jsx
│   │   ├── TaskFiles.jsx
│   │   └── TaskReview.jsx
│   │
│   └── developer/
│       └── DeveloperSummary.jsx
│
└── services/
    ├── taskService.js
    └── projectService.js
```

Actual paths may be adjusted to match the existing project structure.

---

# 50. Backend Components

Recommended:

```text
server/
├── routes/
│   ├── taskRoutes.js
│   └── projectRoutes.js
│
├── controllers/
│   ├── taskController.js
│   └── projectController.js
│
├── services/
│   ├── taskService.js
│   └── projectService.js
│
└── middleware/
    ├── authMiddleware.js
    └── permissionMiddleware.js
```

---

# 51. Developer System and Database

The developer system depends primarily on:

```text
users
projects
project_members
tasks
task_comments
task_reviews
files
notifications
activity_logs
```

See:

```text
DATABASE.md
```

for the authoritative database specification.

---

# 52. Developer System and Activity Log

Developer events must follow:

```text
ACTIVITY_LOG.md
```

Do not invent a second activity logging system inside the developer module.

---

# 53. Developer System and Authentication

Authentication and session rules must follow:

```text
AUTHENTICATION.md
```

The developer system assumes a valid authenticated session.

---

# 54. Developer System and API

All API behavior must follow:

```text
API.md
```

Do not create inconsistent endpoint patterns.

---

# 55. Developer System and Coding Standards

Implementation must follow:

```text
CODING_STANDARD.md
```

Use the project's existing conventions rather than introducing a separate style inside this module.

---

# 56. No External API Requirement

The initial Developer System does not require third-party APIs.

Primary architecture:

```text
React
   ↓
Express.js
   ↓
MySQL
   ↓
Hostinger Filesystem
```

No external task management service is required.

---

# 57. No Third-Party Task Management Dependency

PCT is intended to replace the internal developer task sheet/workflow.

Do not integrate:

```text
Trello
Jira
Asana
ClickUp
Monday
Notion
```

unless explicitly requested.

---

# 58. Developer System Completion Criteria

The Developer System is considered complete when:

```text
[ ] Developer can authenticate
[ ] Developer sees personal dashboard
[ ] Developer can view assigned tasks
[ ] Developer can search tasks
[ ] Developer can filter tasks
[ ] Developer can open task details
[ ] Developer can update permitted task fields
[ ] Developer can start assigned tasks
[ ] Developer can submit tasks for review
[ ] Developer can see review feedback
[ ] Developer can handle revision requests
[ ] Developer can comment on tasks
[ ] Developer can upload task files
[ ] Developer can access authorized files
[ ] Developer can view relevant projects
[ ] Developer receives relevant notifications
[ ] Developer activity is logged
[ ] Developer cannot access unauthorized resources
[ ] Developer cannot approve their own work
[ ] API authorization is enforced server-side
[ ] Database operations are secure
[ ] Loading/error/empty states exist
[ ] Pagination exists where required
```

---

# 59. Final Developer System Principle

> **PCT should give every developer one reliable place to know what they need to build, what they are currently working on, what needs revision, what is waiting for review, and what they need to do next.**

The Developer System is the operational workspace of PCT — replacing scattered task sheets with a structured, permission-controlled internal workflow.
