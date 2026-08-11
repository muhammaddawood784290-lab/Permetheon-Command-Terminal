# PCT — Project System

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Document Type:** Project Management System Specification
**Status:** Active Development
**Version:** 1.0

---

# 1. Purpose

The Project System manages all development projects inside PCT.

A project is the primary organizational container for development work.

Projects connect:

```text id="q7v4p1"
Project
   │
   ├── Members
   ├── Tasks
   ├── Files
   ├── Comments
   ├── Activity
   └── Project Status
```

The Project System provides a structured way to organize and monitor development work.

---

# 2. Project Hierarchy

The basic PCT hierarchy is:

```text id="j7y5v3"
Organization
     ↓
Project
     ↓
Task
     ↓
Work
     ↓
Review
     ↓
Completion
```

Example:

```text id="k1q3as"
Permetheon
   ↓
Client Website Project
   ↓
Homepage Development
   ↓
Developer Work
   ↓
Review
   ↓
Approved
```

---

# 3. Project Responsibilities

The Project System is responsible for:

```text id="0c2a4e"
Project Creation
Project Information
Project Status
Project Members
Project Tasks
Project Files
Project Activity
Project Visibility
Project Archiving
```

It is NOT responsible for implementing the full task workflow.

Task behavior belongs to the Task System.

---

# 4. Project Entity

A project should contain at minimum:

```text id="6s8e5x"
id
name
description
status
created_by
start_date
deadline
created_at
updated_at
```

Additional fields may be introduced when required.

---

# 5. Project Name

Every project must have a unique or sufficiently identifiable name.

Example:

```text id="z8q2ma"
Nova Nail Studio Website & CRM
```

Project names should be:

```text id="c4s1b7"
Clear
Readable
Specific
```

Avoid meaningless names such as:

```text id="d5r8x0"
Project 1
Test
New Project
ABC
```

unless they are genuinely required.

---

# 6. Project Description

A project may contain a description explaining its purpose.

Example:

```text id="r0s2z5"
Website and internal CRM development for Nova Nail Studio,
including Phorest integration and maintenance setup.
```

The description should provide enough context for developers and reviewers.

---

# 7. Project Status

Initial project statuses:

```text id="3j4c8p"
PLANNING
ACTIVE
ON_HOLD
COMPLETED
ARCHIVED
```

Status names should remain consistent throughout the application.

---

# 8. Project Lifecycle

Standard lifecycle:

```text id="kq5f7s"
PLANNING
    ↓
ACTIVE
    ↓
COMPLETED
    ↓
ARCHIVED
```

Alternative path:

```text id="c1f9x2"
ACTIVE
   ↓
ON_HOLD
   ↓
ACTIVE
```

Projects should not be permanently deleted by default.

---

# 9. Planning Status

`PLANNING` means:

```text id="j1b6v8"
Project exists
Requirements are being prepared
Work has not officially started
```

Tasks may be created during planning if required.

---

# 10. Active Status

`ACTIVE` means the project is currently being worked on.

Active projects may contain:

```text id="2x8r1k"
Active Tasks
Developers
Files
Reviews
Comments
```

---

# 11. On Hold Status

`ON_HOLD` means work is temporarily paused.

Possible reasons:

```text id="f0c7da"
Client dependency
Missing requirements
Technical blocker
Internal decision
Resource availability
```

The reason may be stored as a project note if required.

---

# 12. Completed Status

`COMPLETED` means the project's required development work has been completed.

Completion should normally happen after relevant tasks have been completed.

However, the system should not assume every task must be completed unless the business workflow explicitly requires it.

---

# 13. Archived Status

`ARCHIVED` means the project is no longer part of active operations but remains available for historical reference.

Archived projects should generally be:

```text id="v7k3x1"
Read-only or restricted
Excluded from active dashboards
Retained for history
```

---

# 14. Project Creation

A project may be created by an authorized user.

Creation flow:

```text id="v5d2n9"
Create Project
     ↓
Validate Input
     ↓
Create Database Record
     ↓
Create Project Activity
     ↓
Assign Initial Members if applicable
     ↓
Project Available
```

---

# 15. Project Creation Permissions

Initial recommendation:

```text id="q8m4w6"
Admin
Team Lead
```

may create projects.

Developers should not create projects unless explicitly granted permission.

Authorization must be enforced by the backend.

---

# 16. Project Editing

Authorized users may edit project information.

Editable information may include:

```text id="e9x3a1"
Name
Description
Status
Start Date
Deadline
```

The exact editable fields depend on role permissions.

---

# 17. Project Deletion

Permanent project deletion should NOT be the default behavior.

Preferred:

```text id="h4p8m2"
Active
  ↓
Completed
  ↓
Archived
```

If permanent deletion is introduced later, it must require strong authorization and confirmation.

---

# 18. Project Members

Projects may contain multiple members.

Example:

```text id="q3m7v1"
Project
   │
   ├── Team Lead
   ├── Developer A
   ├── Developer B
   └── Developer C
```

Membership should be stored through a relationship table.

---

# 19. Project Membership

A project member record should conceptually contain:

```text id="b7c2x9"
project_id
user_id
role
created_at
```

Possible project-level roles:

```text id="w8d4s6"
OWNER
LEAD
DEVELOPER
REVIEWER
```

The final role model must remain consistent with the authorization system.

---

# 20. Project Owner

The project owner is the primary internal person responsible for the project.

A project should have one primary owner unless the business model explicitly supports multiple owners.

The owner may be responsible for:

```text id="f3r8k1"
Project coordination
Member management
Project status
High-level progress
```

---

# 21. Project Lead

A project lead manages the development workflow within the project.

Typical responsibilities:

```text id="v4j9p2"
Assign Tasks
Review Work
Monitor Progress
Coordinate Developers
Manage Project Status
```

---

# 22. Developer Membership

Developers assigned to a project should be able to access the relevant project information.

Access should normally include:

```text id="n8m2q4"
Project Details
Assigned Tasks
Relevant Files
Relevant Comments
Relevant Activity
```

They should not automatically gain administrative access.

---

# 23. Adding Members

Authorized users can add members to a project.

Flow:

```text id="x7k5s2"
Select User
   ↓
Select Project Role
   ↓
Validate Permission
   ↓
Create Membership
   ↓
Activity Log
   ↓
Optional Notification
```

---

# 24. Removing Members

Removing a member should:

```text id="r2c6w8"
Remove Project Membership
```

but should not automatically delete:

```text id="g9t3p1"
Tasks
Comments
Activity
Files
Historical Records
```

Historical records must remain intact.

---

# 25. Member Access After Removal

After removal, a user should no longer have normal project access.

However, their historical actions must remain visible in audit/activity records where appropriate.

Example:

```text id="m8q4v2"
Developer removed from project
        ↓
Old Activity:
"Developer X completed Task #102"
```

must remain historically valid.

---

# 26. Project Tasks

Tasks belong to projects.

Conceptually:

```text id="s3f8d1"
Project #10
   │
   ├── Task #101
   ├── Task #102
   ├── Task #103
   └── Task #104
```

A task should reference its project through:

```text id="c5m7x2"
project_id
```

---

# 27. Project Task Visibility

Project members should generally be able to see tasks relevant to their project permissions.

However, task-level authorization may further restrict access.

The backend must determine access.

---

# 28. Project Task Statistics

The project page may display:

```text id="p4n8r3"
Total Tasks
Backlog
Assigned
In Progress
Review
Revision Required
Completed
```

Example:

```text id="s8w2j5"
Total: 42
In Progress: 8
Review: 4
Completed: 27
Revision: 3
```

These values should be calculated from the database.

---

# 29. Project Progress

A project progress indicator may be calculated from task completion.

Example concept:

```text id="m5q1v7"
Completed Tasks / Total Tasks × 100
```

The exact progress calculation should be documented and consistent throughout PCT.

Do not manually store progress unless there is a strong reason.

---

# 30. Project Deadline

A project may have a deadline.

Example:

```text id="d2x7c4"
deadline = 2026-09-30
```

The project dashboard may display:

```text id="y4m8n1"
On Track
Due Soon
Overdue
```

The exact status should be calculated based on project state and dates.

---

# 31. Project Dates

Recommended date fields:

```text id="e8p3k5"
start_date
deadline
created_at
updated_at
```

All dates must be handled consistently by the backend.

---

# 32. Project Files

Projects may contain files.

Examples:

```text id="t7q2m9"
Requirements
Design Files
Documentation
Assets
Build Files
Reference Files
```

Physical files are stored through the PCT filesystem system.

Detailed rules:

```text id="a9v5c1"
FILE_SYSTEM.md
```

---

# 33. Project File Relationship

A file should reference its project through metadata.

Conceptually:

```text id="j3k8s4"
file
 ├── entity_type = PROJECT
 └── entity_id = project_id
```

The exact implementation follows `FILE_SYSTEM.md` and `DATABASE.md`.

---

# 34. Project Comments

Projects may contain comments for project-level communication.

Example:

```text id="q8d2x6"
"Client requested final changes to the booking flow."
```

Comments should remain associated with the relevant project.

---

# 35. Project Activity

Important project actions must generate activity records.

Examples:

```text id="v6m1r8"
Project Created
Project Updated
Member Added
Member Removed
Status Changed
Deadline Changed
Project Completed
Project Archived
```

Detailed behavior:

```text id="n2c7f4"
ACTIVITY_LOG.md
```

---

# 36. Project Notifications

Some project events may create notifications.

Examples:

```text id="m4x9s1"
Project Assigned
Added to Project
Project Status Changed
Important Project Update
```

Notifications should only be sent to users who need awareness or action.

Detailed behavior:

```text id="c7p3k8"
NOTIFICATION_SYSTEM.md
```

---

# 37. Project Dashboard

Each project should have a project overview page.

Recommended sections:

```text id="r5v2m7"
Project Header
Project Status
Project Description
Project Members
Progress
Task Summary
Recent Activity
Files
Comments
```

---

# 38. Project Header

The project header should display:

```text id="x1n8q4"
Project Name
Status
Owner
Deadline
Progress
```

Optional:

```text id="h6m3s9"
Start Date
Member Count
Task Count
```

---

# 39. Project Task List

The project page should provide a task list.

Recommended columns:

```text id="w7k2p5"
Task
Assignee
Priority
Status
Deadline
Updated
```

The exact columns may change depending on screen size.

---

# 40. Project Filtering

The project task list may support:

```text id="f3r9v2"
Status
Priority
Developer
Deadline
```

Filtering must be handled efficiently.

---

# 41. Project Search

PCT may support searching projects by:

```text id="q6m1x8"
Project Name
Description
```

Search behavior should remain simple initially.

Advanced full-text search is not required for V1.

---

# 42. Project List

The main project page should display projects in a manageable format.

Possible views:

```text id="n8v4c2"
Table
Cards
```

The initial implementation should prioritize usability rather than supporting many visual modes.

---

# 43. Active Projects

The default project view should prioritize active projects.

Example:

```text id="z3m7p1"
ACTIVE
PLANNING
ON_HOLD
```

Completed and archived projects may be separated into historical views.

---

# 44. Archived Projects

Archived projects should remain searchable/viewable by authorized users.

They should not clutter the active project list.

Possible UI:

```text id="q9x2k5"
Projects
├── Active
├── Completed
└── Archived
```

---

# 45. Project Status Changes

Status changes must be validated by the backend.

Example:

```text id="s4v8m2"
PLANNING → ACTIVE
ACTIVE → ON_HOLD
ON_HOLD → ACTIVE
ACTIVE → COMPLETED
COMPLETED → ARCHIVED
```

Invalid transitions should be rejected.

---

# 46. Project Status Audit

Every important status change should create an Activity Log.

Example:

```text id="c8n1x5"
Project status changed:
ACTIVE → ON_HOLD
```

The activity should identify the user responsible for the change.

---

# 47. Project Completion

Before completing a project, the system may display a confirmation.

Example:

```text id="m2q7v9"
Complete Project?

This will mark the project as completed.
```

The application should not silently complete projects.

---

# 48. Project Completion and Tasks

Completing a project does not automatically delete or modify its tasks.

Existing task history must remain available.

If automatic task closure is introduced, it must be explicitly documented and confirmed.

---

# 49. Project Archiving

Archiving is intended for historical projects.

After archiving:

```text id="p5x8k3"
Project remains stored
Tasks remain stored
Files remain stored
Activity remains stored
Historical records remain available
```

---

# 50. Project Access Control

Every project request must pass through authorization.

The backend must verify:

```text id="y7m2c9"
Authenticated User
        ↓
Project Access
        ↓
Requested Action
```

Examples:

```text id="n4q8s1"
View Project
Edit Project
Add Member
Remove Member
Create Task
Upload File
Archive Project
```

Permissions may differ by role.

---

# 51. Admin Permissions

Admins may have full project management access.

Typical:

```text id="x2c7m5"
Create
View
Edit
Manage Members
Change Status
Archive
```

---

# 52. Team Lead Permissions

Team Leads may typically:

```text id="r8p3n6"
View
Edit
Manage Tasks
Manage Members where permitted
Review Work
Change Project Status where permitted
```

Exact permissions should follow the authorization model.

---

# 53. Developer Permissions

Developers typically:

```text id="j5v9q2"
View Assigned Projects
View Relevant Project Information
View Assigned Tasks
Upload Relevant Files
Comment
Update Assigned Tasks
```

They should not automatically have:

```text id="a3m8x7"
Full Project Administration
Member Management
Project Deletion
```

---

# 54. Project Security Rules

The backend must never trust:

```text id="w4k1s8"
project_id
user_id
role
permission
```

sent by the frontend.

The authenticated user identity comes from the authentication system.

Authorization is calculated server-side.

---

# 55. Project API

Initial project endpoints may include:

```text id="d8x2m5"
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PATCH  /api/projects/:id
PATCH  /api/projects/:id/status
DELETE /api/projects/:id
```

Member endpoints:

```text id="f1v7q3"
GET    /api/projects/:id/members
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
```

Exact endpoint definitions belong in:

```text id="m6c9x2"
API.md
```

---

# 56. Project Creation Request

Conceptual request:

```json id="q3p8w1"
{
  "name": "Nova Nail Studio Website & CRM",
  "description": "Website and CRM development project.",
  "start_date": "2026-08-15",
  "deadline": "2026-10-01"
}
```

The backend should assign:

```text id="r5m2n7"
created_by
status
created_at
updated_at
```

rather than trusting the client.

---

# 57. Project Response

A project response may contain:

```json id="x8k4s2"
{
  "id": 12,
  "name": "Nova Nail Studio Website & CRM",
  "description": "Website and CRM development project.",
  "status": "ACTIVE",
  "start_date": "2026-08-15",
  "deadline": "2026-10-01"
}
```

Sensitive internal fields should not be exposed unnecessarily.

---

# 58. Project Database Relationships

Conceptual relationships:

```text id="v1m7q4"
users
  │
  ├──── project_members ──── projects
  │                              │
  │                              ├── tasks
  │                              ├── files
  │                              ├── comments
  │                              └── activity_logs
  │
  └──── notifications
```

The exact schema is defined in:

```text id="s6x2p9"
DATABASE.md
```

---

# 59. Project Deletion Strategy

Preferred behavior:

```text id="j8c4m1"
Do not permanently delete active project data.
```

Use:

```text id="q2v7s5"
COMPLETED
   ↓
ARCHIVED
```

for normal lifecycle management.

If deletion becomes necessary, it should be an explicit administrative operation.

---

# 60. Project Data Integrity

The system must prevent invalid relationships.

Examples:

```text id="w5m9x2"
Task references nonexistent project
Project member references nonexistent user
File references nonexistent project
```

Database foreign keys and backend validation should protect against these cases.

---

# 61. Project Error Handling

Typical errors:

```text id="f7p3k8"
Project not found
Unauthorized
Forbidden
Invalid status transition
Invalid member
Duplicate membership
Invalid project data
```

Errors should return consistent API responses according to:

```text id="z1n6c4"
API.md
```

---

# 62. Project Performance

Project pages should not load unlimited data at once.

Use:

```text id="m4x8q2"
Pagination
Limited queries
Indexed relationships
Efficient joins
```

For example, a project page should not automatically load thousands of historical activities.

---

# 63. Project Activity Pagination

Recent activity should be loaded first.

Example:

```text id="c5v1s7"
Latest 20 activities
        ↓
Load More
```

This prevents large projects from becoming unnecessarily heavy.

---

# 64. Project Task Pagination

Task lists should support pagination when the number of tasks becomes large.

Example:

```text id="q8m3x6"
20–50 tasks per page
```

The exact page size should be configurable.

---

# 65. Project UI States

The project module must support:

```text id="a2f7n9"
Loading
Success
Empty
Error
Unauthorized
Not Found
```

---

# 66. Empty Project State

If a project has no tasks:

```text id="p4x8m1"
No tasks have been added to this project yet.
```

If the user has permission, provide:

```text id="j7c2v5"
+ Create Task
```

---

# 67. Empty Member State

If no members are assigned:

```text id="r6n3q8"
No project members assigned.
```

Authorized users may see:

```text id="b1m5x9"
+ Add Member
```

---

# 68. Project UI Components

Recommended frontend structure:

```text id="z8q4m2"
client/src/
└── components/
    └── projects/
        ├── ProjectCard.jsx
        ├── ProjectList.jsx
        ├── ProjectHeader.jsx
        ├── ProjectMembers.jsx
        ├── ProjectTasks.jsx
        ├── ProjectFiles.jsx
        ├── ProjectActivity.jsx
        └── ProjectStatus.jsx
```

Actual component organization may be adjusted to match the existing frontend architecture.

---

# 69. Project Pages

Recommended routes:

```text id="n2v7c5"
/projects
/projects/:id
/projects/:id/tasks
/projects/:id/files
```

Not every route must be implemented as a separate page.

Tabs/components may be used instead.

---

# 70. Project Service

Recommended frontend service:

```text id="k4m8x1"
client/src/services/projectService.js
```

Responsibilities:

```text id="j9q3v6"
getProjects()
getProject(id)
createProject(data)
updateProject(id, data)
updateProjectStatus(id, status)
getProjectMembers(id)
addProjectMember(id, userId, role)
removeProjectMember(id, userId)
```

---

# 71. Backend Project Structure

Recommended:

```text id="s5x2n8"
server/
├── routes/
│   └── projectRoutes.js
│
├── controllers/
│   └── projectController.js
│
├── services/
│   └── projectService.js
│
└── validators/
    └── projectValidator.js
```

The exact structure should remain consistent with the project's existing architecture.

---

# 72. Project Business Rules

Initial rules:

```text id="c8m4v1"
1. Every project must have a name.
2. Every project has a status.
3. Every project has a creator.
4. Project members are controlled through project membership.
5. Tasks belong to projects.
6. Project files are stored through the file system module.
7. Important project changes create activity logs.
8. Relevant project events may create notifications.
9. Authorization is enforced by the backend.
10. Archived projects remain historically accessible.
```

---

# 73. Project Workflow Example

Complete example:

```text id="w7q2m5"
Admin creates project
        ↓
Project = PLANNING
        ↓
Team Lead added
        ↓
Developers added
        ↓
Project = ACTIVE
        ↓
Tasks created
        ↓
Tasks assigned
        ↓
Developers work
        ↓
Tasks submitted for review
        ↓
Tasks approved
        ↓
Project work completed
        ↓
Project = COMPLETED
        ↓
Project = ARCHIVED
```

---

# 74. Project Activity Example

Example activity history:

```text id="f3n8x1"
10:00 — Project created
10:05 — Team Lead added
10:15 — Developer A added
10:30 — Project status changed to ACTIVE
11:00 — Task #101 created
11:05 — Task #101 assigned to Developer A
14:30 — Task #101 submitted for review
15:10 — Task #101 approved
```

This history should remain available according to Activity Log permissions.

---

# 75. Project Notification Example

Example:

```text id="m6q2v9"
Project member added
        ↓
Notification
        ↓
Developer
```

Notification:

```text id="r4x7c1"
"You have been added to the Nova Nail Studio project."
```

---

# 76. Project System Testing

The Project System must be tested for:

```text id="p8m3x5"
[ ] Create project
[ ] View project
[ ] Update project
[ ] Change status
[ ] Add member
[ ] Remove member
[ ] Create project task
[ ] View project tasks
[ ] Upload project file
[ ] View project activity
[ ] Project notification behavior
[ ] Unauthorized access
[ ] Invalid project ID
[ ] Invalid status transition
[ ] Duplicate membership
[ ] Archived project behavior
```

---

# 77. Security Testing

Verify that:

```text id="q5n1x8"
[ ] Developer cannot access unauthorized project
[ ] Developer cannot edit unauthorized project
[ ] Developer cannot add arbitrary members
[ ] User cannot modify another user's membership
[ ] Invalid project IDs are handled safely
[ ] Client-supplied role values are not trusted
[ ] SQL queries are parameterized
[ ] Project files respect project permissions
```

---

# 78. Performance Testing

Verify:

```text id="x7m4c2"
[ ] Project list loads efficiently
[ ] Project detail loads efficiently
[ ] Large task lists are paginated
[ ] Large activity lists are paginated
[ ] Member queries are indexed
[ ] No unnecessary duplicate database queries
```

---

# 79. Definition of Done

The Project System is complete when:

```text id="n3q8v5"
[ ] Project CRUD works
[ ] Project statuses work
[ ] Status transitions are validated
[ ] Project members work
[ ] Project permissions work
[ ] Project tasks integrate correctly
[ ] Project files integrate correctly
[ ] Project activity works
[ ] Project notifications work where required
[ ] Project dashboard works
[ ] Loading states work
[ ] Empty states work
[ ] Error states work
[ ] Database relationships are correct
[ ] API endpoints are documented
[ ] Security checks are implemented
[ ] Production build succeeds
```

---

# 80. Final Project System Principle

> **A Project in PCT is the central container for a defined piece of Permetheon development work. It connects people, tasks, files, communication, activity, and progress while keeping authorization and data ownership controlled by the backend.**

The Project System should remain focused on organizing development work and should not become an unnecessarily complex project-management platform.
