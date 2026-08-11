# PCT — Role & Permissions System

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Document Type:** Role-Based Access Control Specification
**Status:** Active Development
**Version:** 1.0

---

# 1. Purpose

The Role & Permissions System controls what users can access and what actions they can perform inside PCT.

PCT uses role-based access control (RBAC).

```text
User
  ↓
Role
  ↓
Permissions
  ↓
Allowed Actions
```

The purpose is to ensure that users only access functionality appropriate to their responsibilities.

---

# 2. Core Security Principle

> **Frontend visibility is not security. Backend authorization is mandatory.**

Example:

```text
React
  ↓
Hide Admin Button
```

is not sufficient.

Correct:

```text
React
  ↓
Request
  ↓
Express.js
  ↓
Authentication
  ↓
Authorization
  ↓
Permission Check
  ↓
Action
```

---

# 3. Initial Roles

PCT V1 uses the following primary roles:

```text
ADMIN
TEAM_LEAD
DEVELOPER
```

Additional roles should not be created unless a real workflow requires them.

---

# 4. Role Overview

| Role      | Primary Responsibility                  |
| --------- | --------------------------------------- |
| ADMIN     | Full system administration              |
| TEAM_LEAD | Development team and project management |
| DEVELOPER | Development work and assigned tasks     |

---

# 5. ADMIN

Admin is the highest-level operational role.

Admins may manage:

```text
Users
Projects
Project Members
Tasks
Reviews
Files
Notifications
Reports
System Configuration
```

Subject to security restrictions and system-level safeguards.

---

# 6. ADMIN Permissions

Recommended Admin capabilities:

```text
Users:
    Create
    View
    Edit
    Disable
    Manage Roles

Projects:
    Create
    View
    Edit
    Manage Members
    Change Status
    Archive

Tasks:
    Create
    View
    Edit
    Assign
    Change Status
    Delete where permitted

Reviews:
    View
    Assign Reviewer
    Review
    Approve
    Request Revision

Files:
    Upload
    View
    Download
    Delete where permitted

Reports:
    View All
    Export

Activity:
    View System Activity

Notifications:
    View
    Manage where permitted
```

---

# 7. TEAM_LEAD

Team Leads are responsible for managing development work without having unrestricted system administration privileges.

Typical responsibilities:

```text
Project Management
Task Management
Developer Assignment
Review
Workload Monitoring
Project Reporting
```

---

# 8. TEAM_LEAD Permissions

Recommended:

```text
Projects:
    Create
    View
    Edit
    Manage Project Members
    Change Project Status

Tasks:
    Create
    View
    Edit
    Assign
    Change Status

Reviews:
    View
    Review
    Approve
    Request Revision

Files:
    Upload
    View
    Download

Reports:
    View Team / Project Reports

Activity:
    View Relevant Activity

Notifications:
    View
```

Team Leads should not automatically receive:

```text
Global User Administration
Role Management
System Configuration
```

---

# 9. DEVELOPER

Developers are primarily responsible for completing assigned development work.

Developers should have access to the projects and tasks relevant to their work.

---

# 10. DEVELOPER Permissions

Recommended:

```text
Projects:
    View Authorized Projects

Tasks:
    View Authorized Tasks
    Update Assigned Tasks
    Submit Tasks for Review
    Comment

Reviews:
    View Own Review Results
    Read Review Feedback
    Resubmit Revised Work

Files:
    View Authorized Files
    Upload Relevant Files
    Download Authorized Files

Reports:
    View Own / Authorized Reports

Activity:
    View Relevant Activity

Notifications:
    View Own Notifications
```

Developers should not normally:

```text
Create Global Projects
Manage Users
Manage Roles
Manage Project Membership
Approve Their Own Work
Archive Projects
```

---

# 11. Permission Model

Permissions should be represented as actions over resources.

Concept:

```text
RESOURCE
    +
ACTION
    =
PERMISSION
```

Example:

```text
PROJECT + CREATE
PROJECT + VIEW
PROJECT + UPDATE
PROJECT + ARCHIVE
```

---

# 12. Permission Naming Convention

Use a consistent naming convention:

```text
resource.action
```

Examples:

```text
project.create
project.view
project.update
project.archive

task.create
task.view
task.update
task.assign
task.delete

review.view
review.approve
review.revision

user.view
user.create
user.update
user.disable
```

---

# 13. Core Permission Groups

Initial permission groups:

```text
PROJECT
TASK
REVIEW
USER
FILE
REPORT
ACTIVITY
NOTIFICATION
```

---

# 14. Project Permissions

Recommended project permissions:

```text
project.create
project.view
project.update
project.change_status
project.manage_members
project.archive
```

Optional future:

```text
project.delete
```

Permanent deletion should not be part of normal workflow.

---

# 15. Task Permissions

Recommended:

```text
task.create
task.view
task.update
task.assign
task.change_status
task.submit_review
task.delete
```

`task.delete` should be restricted.

---

# 16. Review Permissions

Recommended:

```text
review.view
review.submit
review.start
review.approve
review.request_revision
review.assign
```

Developers normally receive:

```text
review.view
review.submit
```

plus access to their review feedback.

---

# 17. User Permissions

Recommended:

```text
user.view
user.create
user.update
user.disable
user.manage_roles
```

Only Admin should normally receive:

```text
user.create
user.disable
user.manage_roles
```

---

# 18. File Permissions

Recommended:

```text
file.view
file.upload
file.download
file.delete
```

File access must also respect the project/task relationship.

Having:

```text
file.view
```

does not automatically mean access to every file in PCT.

---

# 19. Report Permissions

Recommended:

```text
report.view
report.export
report.view_team
report.view_all
```

Example:

```text
ADMIN
    report.view_all
    report.export

TEAM_LEAD
    report.view_team
    report.export

DEVELOPER
    report.view
```

Actual data visibility remains scope-controlled.

---

# 20. Activity Permissions

Recommended:

```text
activity.view
activity.view_project
activity.view_task
activity.view_system
```

Developers should generally see relevant activity rather than unrestricted system-wide activity.

---

# 21. Notification Permissions

Recommended:

```text
notification.view
notification.mark_read
notification.manage
```

Users should normally be able to manage their own notification state.

System-wide notification management should be restricted.

---

# 22. Permission Matrix

Initial high-level matrix:

| Capability            | Admin | Team Lead | Developer |
| --------------------- | :---: | :-------: | :-------: |
| View Projects         |   ✅   |     ✅     |     ✅*    |
| Create Projects       |   ✅   |     ✅     |     ❌     |
| Edit Projects         |   ✅   |     ✅     |     ❌     |
| Manage Members        |   ✅   |     ✅     |     ❌     |
| Archive Projects      |   ✅   |     ✅     |     ❌     |
| View Tasks            |   ✅   |     ✅     |     ✅*    |
| Create Tasks          |   ✅   |     ✅     |     ❌*    |
| Assign Tasks          |   ✅   |     ✅     |     ❌     |
| Update Assigned Tasks |   ✅   |     ✅     |     ✅     |
| Submit Review         |   ✅   |     ✅     |     ✅     |
| Approve Review        |   ✅   |     ✅     |     ❌     |
| Request Revision      |   ✅   |     ✅     |     ❌     |
| View Files            |   ✅   |     ✅     |     ✅*    |
| Upload Files          |   ✅   |     ✅     |     ✅*    |
| Delete Files          |   ✅   |  Limited  |     ❌     |
| View Reports          |   ✅   |     ✅     |  Limited  |
| Export Reports        |   ✅   |     ✅     |     ❌     |
| View System Activity  |   ✅   |  Limited  |     ❌     |
| Manage Users          |   ✅   |     ❌     |     ❌     |
| Manage Roles          |   ✅   |     ❌     |     ❌     |

`*` = limited by project/task authorization.

---

# 23. Scope-Based Authorization

Permissions alone are not enough.

PCT should combine:

```text
Role Permission
+
Resource Scope
```

Example:

```text
Developer
    ↓
task.view = allowed
    ↓
Does this task belong to an authorized project?
    ↓
YES → Allow
NO  → Deny
```

---

# 24. Project Scope

A user may access a project when one of the following applies:

```text
User is Admin
User is Project Owner
User is Project Lead
User is Project Member
```

The exact scope must follow the project membership rules.

---

# 25. Task Scope

A developer should generally access a task when:

```text
Task belongs to an authorized project
```

and/or:

```text
Task is assigned to the developer
```

depending on the action.

Example:

```text
View Task
    ↓
Project Access

Update Task
    ↓
Project Access
+
Task Assignment / Permission
```

---

# 26. Review Scope

A reviewer may access a review when:

```text
User is Assigned Reviewer
OR
User is Team Lead with review permission
OR
User is Admin
```

A developer may access their own review feedback.

---

# 27. File Scope

File access must inherit the permissions of its related resource.

Example:

```text
Project File
    ↓
Check Project Access
    ↓
Allow / Deny
```

Task file:

```text
Task File
    ↓
Check Task / Project Access
    ↓
Allow / Deny
```

---

# 28. Backend Middleware

Recommended middleware:

```text
server/
└── middleware/
    ├── authenticate.js
    ├── authorize.js
    └── permission.js
```

Conceptual usage:

```js
router.patch(
  "/projects/:id",
  authenticate,
  requirePermission("project.update"),
  updateProject
);
```

The exact implementation should follow the project's authentication architecture.

---

# 29. Authentication vs Authorization

These are different.

### Authentication

Answers:

> Who are you?

```text
Login
   ↓
Authenticated User
```

### Authorization

Answers:

> What are you allowed to do?

```text
Authenticated User
   ↓
Role
   ↓
Permission
   ↓
Resource Scope
   ↓
Allow / Deny
```

Authentication documentation:

```text
AUTHENTICATION.md
```

---

# 30. Permission Check Order

Recommended order:

```text
Request
  ↓
Authenticate
  ↓
Identify User
  ↓
Load Role
  ↓
Check Permission
  ↓
Check Resource Scope
  ↓
Execute Action
```

---

# 31. Forbidden Response

When authentication succeeds but permission fails:

```http
403 Forbidden
```

Example response:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action."
  }
}
```

Exact API format must follow `API.md`.

---

# 32. Unauthorized Response

When authentication is missing or invalid:

```http
401 Unauthorized
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication is required."
  }
}
```

---

# 33. Frontend Permission Handling

Frontend may use permissions for UX.

Example:

```text
User has:
project.update
        ↓
Show Edit Project button
```

Without permission:

```text
Hide / disable button
```

But this is only a UX layer.

The backend must independently enforce the same permission.

---

# 34. Do Not Trust Frontend Roles

Never accept:

```json
{
  "role": "ADMIN"
}
```

from the client as proof of authorization.

The server must determine the authenticated user's role from trusted authentication/database state.

---

# 35. Role Storage

A user should have a role associated with their account.

Conceptual:

```text
users
------
id
name
email
password_hash
role
status
created_at
updated_at
```

If the system later requires multiple roles per user, the architecture may be extended.

V1 should prefer the simpler model unless multiple roles are genuinely required.

---

# 36. Permission Storage

For V1, permissions may be defined in application code rather than requiring a complex permission-management database.

Example:

```js
const permissions = {
  ADMIN: [...],
  TEAM_LEAD: [...],
  DEVELOPER: [...]
};
```

This keeps the system simple.

A database-driven permission system can be introduced later if required.

---

# 37. Role Changes

Changing a user's role is a sensitive administrative action.

Example:

```text
DEVELOPER
    ↓
TEAM_LEAD
```

Only authorized administrators should perform role changes.

Role changes should generate an Activity Log.

---

# 38. Role Change Activity

Example:

```text
Admin changed Developer A role
from DEVELOPER to TEAM_LEAD.
```

The activity should record:

```text
Actor
Target User
Old Role
New Role
Timestamp
```

---

# 39. Disabled Users

A disabled user should not be able to perform normal authenticated actions.

Conceptual:

```text
User Status = DISABLED
        ↓
Authentication denied
```

Existing historical records should remain intact.

---

# 40. Role Deletion

Roles should not be casually deleted.

Initial roles:

```text
ADMIN
TEAM_LEAD
DEVELOPER
```

are core system roles.

If roles are ever changed, existing users must be migrated safely.

---

# 41. Permission Escalation Prevention

Users must not be able to:

```text
Change their own role
Grant themselves permissions
Change another user's role
Modify permission definitions
Bypass middleware
```

through frontend requests or manipulated API payloads.

---

# 42. API Authorization

Every protected API endpoint must specify its required permission.

Example:

```text
POST /api/projects
    → project.create

PATCH /api/projects/:id
    → project.update

POST /api/projects/:id/members
    → project.manage_members

PATCH /api/reviews/:id/approve
    → review.approve
```

---

# 43. Database Authorization

Database access should happen through backend services.

The frontend must never connect directly to MySQL.

Correct:

```text
React
  ↓
Express
  ↓
Service
  ↓
MySQL
```

Incorrect:

```text
React
  ↓
MySQL
```

---

# 44. Permission Failure Logging

Security-sensitive permission failures may be logged where appropriate.

Example:

```text
Unauthorized attempt:
User #42 attempted to archive Project #17.
```

Do not expose unnecessary security information to the client.

---

# 45. Permission Caching

PCT V1 does not require a dedicated permission cache.

Permissions are expected to be lightweight enough to resolve through the application's normal authentication/authorization layer.

Avoid adding Redis or another caching layer solely for RBAC.

---

# 46. Role & Permission UI

Admin may eventually have:

```text
Settings
   ↓
Users
   ↓
User
   ↓
Role
```

V1 does not require a complex visual permission editor.

Roles and permissions should remain controlled and predictable.

---

# 47. Recommended Frontend Utilities

A simple permission helper may be used:

```text
client/src/utils/permissions.js
```

Example conceptual usage:

```js
hasPermission("project.update")
```

This helper is for UI behavior only.

It is NOT a security mechanism.

---

# 48. Recommended Backend Utility

Recommended:

```text
server/middleware/permission.js
```

Conceptual:

```js
requirePermission("project.update")
```

The middleware should use the authenticated user's trusted role/permission information.

---

# 49. Permission Naming Rules

Use lowercase dot notation:

```text
resource.action
```

Good:

```text
task.assign
review.approve
project.archive
```

Avoid inconsistent names:

```text
CanEditProject
EDIT_PROJECT
editProjectPermission
```

---

# 50. Permission Granularity

Do not create a permission for every tiny UI action.

Good:

```text
project.update
```

Bad:

```text
project.change_name
project.change_description
project.change_deadline
project.change_status_button
```

unless different authorization is actually required.

---

# 51. Admin Override

Admin may have broad access, but sensitive operations should still pass through explicit backend checks.

Do not implement insecure logic such as:

```js
if (user.role === "ADMIN") {
  skipAllValidation();
}
```

Admin access should bypass only authorization restrictions where appropriate, not:

```text
Input Validation
Database Integrity
Security Checks
File Validation
```

---

# 52. Permission Matrix Maintenance

Whenever a new module is introduced:

```text
New Module
    ↓
Define Resources
    ↓
Define Actions
    ↓
Assign Roles
    ↓
Document Permissions
    ↓
Implement Backend Authorization
```

Do not add frontend controls without defining the corresponding backend behavior.

---

# 53. Module Permission Reference

| Module         | Main Permissions                               |
| -------------- | ---------------------------------------------- |
| Authentication | authenticate                                   |
| Projects       | create, view, update, status, members, archive |
| Tasks          | create, view, update, assign, status, review   |
| Reviews        | view, start, approve, revision, assign         |
| Files          | view, upload, download, delete                 |
| Reports        | view, export                                   |
| Activity       | view                                           |
| Notifications  | view, mark_read                                |
| Users          | view, create, update, disable, manage_roles    |

---

# 54. Testing — Role Matrix

### Admin

```text
[ ] Can access all authorized modules
[ ] Can create projects
[ ] Can manage members
[ ] Can assign tasks
[ ] Can review tasks
[ ] Can approve reviews
[ ] Can manage users
[ ] Can manage roles
[ ] Can access authorized reports
```

### Team Lead

```text
[ ] Can manage projects
[ ] Can manage project members
[ ] Can create tasks
[ ] Can assign tasks
[ ] Can review tasks
[ ] Can approve tasks
[ ] Can request revisions
[ ] Cannot manage system roles
[ ] Cannot perform restricted user administration
```

### Developer

```text
[ ] Can access authorized projects
[ ] Can access assigned tasks
[ ] Can update assigned tasks
[ ] Can submit tasks for review
[ ] Can view review feedback
[ ] Can resubmit revisions
[ ] Cannot approve own task
[ ] Cannot manage users
[ ] Cannot manage roles
[ ] Cannot archive projects
```

---

# 55. Security Testing

Verify that:

```text
[ ] Frontend-hidden actions are also backend-protected
[ ] Direct API requests cannot bypass permissions
[ ] Users cannot modify their own roles
[ ] Users cannot grant themselves permissions
[ ] Developers cannot approve their own work
[ ] Developers cannot access unauthorized projects
[ ] Disabled users cannot perform protected actions
[ ] Project scope is enforced
[ ] Task scope is enforced
[ ] File scope is enforced
[ ] Report scope is enforced
```

---

# 56. Definition of Done

The Role & Permissions System is complete when:

```text
[ ] Core roles are defined
[ ] Permission names are standardized
[ ] Permission matrix is implemented
[ ] Backend authorization middleware exists
[ ] Resource-level authorization works
[ ] Project scope works
[ ] Task scope works
[ ] Review permissions work
[ ] File permissions work
[ ] Report permissions work
[ ] User management permissions work
[ ] Frontend permission helpers work
[ ] Unauthorized requests return 401/403 correctly
[ ] Role changes are protected
[ ] Permission failures are handled safely
[ ] Security tests pass
[ ] Documentation matches implementation
```

---

# 57. Final RBAC Principle

PCT authorization follows:

```text
AUTHENTICATION
      ↓
WHO ARE YOU?
      ↓
ROLE
      ↓
WHAT CAN YOU DO?
      ↓
PERMISSION
      ↓
WHERE CAN YOU DO IT?
      ↓
RESOURCE SCOPE
      ↓
ALLOW / DENY
```

The system must always enforce permissions on the **backend**.

The frontend may improve the user experience by hiding unavailable actions, but it must never be considered a security boundary.

> **Role defines capability. Permission defines action. Resource scope defines access. Express.js enforces all three.**
