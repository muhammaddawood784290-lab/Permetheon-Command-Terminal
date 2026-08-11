# PCT — Development Guide

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Document Type:** Development Guide & Engineering Workflow
**Status:** Active
**Version:** 1.0

---

# 1. Purpose

This document defines how PCT should be developed, tested, reviewed, and deployed.

It establishes:

* Development workflow
* Project implementation order
* Frontend development rules
* Backend development rules
* Database development rules
* Authentication implementation
* Feature development process
* Testing requirements
* Debugging workflow
* Git workflow
* Production deployment rules
* Verification requirements

The goal is to keep PCT stable, maintainable, and predictable as development continues.

---

# 2. Core Stack

PCT uses:

```text
Frontend
React 18+
Vite
Tailwind CSS
HTML
JavaScript

Backend
Node.js
Express.js

Database
MySQL

Storage
Hostinger Filesystem
```

Architecture:

```text
React
  │
  │ HTTP
  ▼
Express.js
  │
  ├──────► MySQL
  │
  └──────► Hostinger Filesystem
```

No external API is required for the initial system.

---

# 3. Development Philosophy

PCT should be developed as a real internal production application.

Priorities:

```text
Correctness
Security
Maintainability
Performance
Consistency
Simplicity
```

Do not add complexity merely because a technology exists.

Prefer the simplest implementation that satisfies the requirement.

---

# 4. Source of Truth

Before implementing a feature, review the relevant documentation.

Primary documents include:

```text
ARCHITECTURE.md
ARCHITECTURE_LOG.md
API.md
DATABASE.md
AUTHENTICATION.md
ACTIVITY_LOG.md
DASHBOARD.md
DEVELOPER_SYSTEM.md
CODING_STANDARD.md
```

Documentation is part of the project architecture.

Do not intentionally implement behavior that conflicts with documented requirements.

---

# 5. Development Workflow

Every feature should follow:

```text
Requirement
    ↓
Documentation Review
    ↓
Architecture Check
    ↓
Database Changes
    ↓
Backend Implementation
    ↓
Frontend Implementation
    ↓
Integration
    ↓
Testing
    ↓
Bug Fixing
    ↓
Build Verification
    ↓
Documentation Update
```

---

# 6. Before Starting a Feature

Before writing code:

1. Read the relevant `.md` files.
2. Inspect the existing implementation.
3. Identify affected frontend files.
4. Identify affected backend files.
5. Identify affected database tables.
6. Check existing routes/endpoints.
7. Check authentication/authorization requirements.
8. Determine whether migrations/schema changes are required.
9. Avoid creating duplicate functionality.

---

# 7. Existing Code First

Before creating a new file:

```text
Search existing project
       ↓
Check whether functionality already exists
       ↓
Reuse/refactor if appropriate
       ↓
Create new file only when necessary
```

Do not create duplicate:

```text
services
controllers
components
middleware
utilities
API endpoints
database logic
```

without a clear reason.

---

# 8. Feature Implementation Order

For features involving backend and database, generally implement:

```text
1. Database
2. Backend service
3. Backend controller
4. Backend route
5. Authorization
6. Frontend service
7. Frontend page/component
8. Loading/error states
9. Integration
10. Testing
```

This prevents frontend functionality from being built against imaginary backend behavior.

---

# 9. Database Development

Database changes must follow:

```text
DATABASE.md
```

Before changing a table:

* Check existing relationships.
* Check foreign keys.
* Check indexes.
* Check API dependencies.
* Check existing data.
* Consider migration impact.

Do not make destructive schema changes casually.

---

# 10. Database Migration Rule

Any schema modification must be reproducible.

Changes should be represented through the project's migration/schema process rather than relying only on manual production database edits.

A future developer should be able to understand how the database reached its current state.

---

# 11. Backend Development

Backend architecture:

```text
Request
  ↓
Route
  ↓
Authentication
  ↓
Authorization
  ↓
Controller
  ↓
Service
  ↓
Database / Filesystem
  ↓
Response
```

Avoid placing all logic inside route files.

---

# 12. Express Routes

Routes should primarily define:

```text
HTTP method
Endpoint
Middleware
Controller
```

Example:

```js
router.patch(
  "/tasks/:id/status",
  authenticate,
  authorize("DEVELOPER"),
  taskController.updateStatus
);
```

Business logic should not become a giant route handler.

---

# 13. Controllers

Controllers should handle:

* Request input
* Validation coordination
* Calling services
* HTTP response formatting
* Error forwarding

Controllers should remain relatively thin.

Avoid placing large database queries and business workflows directly inside controllers.

---

# 14. Services

Services contain business logic.

Examples:

```text
taskService.js
projectService.js
authService.js
notificationService.js
activityService.js
fileService.js
```

Services should handle workflows such as:

```text
Update Task
↓
Validate transition
↓
Update database
↓
Create activity
↓
Create notification
```

---

# 15. Authentication Middleware

Protected routes must use authentication middleware.

Typical flow:

```text
Request
 ↓
Authentication Middleware
 ↓
Identify User
 ↓
Authorization Middleware
 ↓
Controller
```

Never trust user identity supplied only through request body/query parameters.

---

# 16. Authorization

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
Are you allowed to do this?
```

Both are required where applicable.

Example:

```text
Developer
   ↓
PATCH /tasks/25/status
   ↓
Authenticated?
   ↓
Authorized?
   ↓
Has access to Task #25?
   ↓
Valid status transition?
   ↓
Update
```

---

# 17. Frontend Development

Frontend architecture:

```text
Page
 ↓
Components
 ↓
Service
 ↓
API
```

React components should not contain unnecessary raw API request logic.

Prefer dedicated service modules.

---

# 18. React Components

Components should have focused responsibilities.

Good:

```text
TaskCard
TaskList
TaskFilters
TaskComments
TaskFiles
TaskReview
```

Avoid one component containing:

```text
Dashboard
Authentication
Task queries
Database-like transformations
Modal logic
File uploads
Notifications
```

all at once.

---

# 19. State Management

Do not introduce a global state library unless the application actually requires one.

Initial preference:

```text
React state
Context where appropriate
Service-based API calls
```

Global state should be introduced only when shared state becomes difficult to manage through simpler methods.

---

# 20. API Communication

Frontend communicates only with Express.

Correct:

```text
React
 ↓
Express API
 ↓
MySQL
```

Incorrect:

```text
React
 ↓
MySQL
```

The frontend must never contain database credentials.

---

# 21. API Standards

All API implementation must follow:

```text
API.md
```

Maintain consistency in:

```text
HTTP methods
Routes
Request structure
Response structure
Status codes
Error handling
Authentication
Authorization
```

Do not create random endpoint naming conventions.

---

# 22. API Error Handling

Backend errors should return predictable responses.

Conceptually:

```json
{
  "success": false,
  "message": "You do not have permission to perform this action."
}
```

Do not expose:

```text
SQL queries
Database credentials
Stack traces
Internal filesystem paths
Sensitive implementation details
```

to normal production users.

---

# 23. Input Validation

All user-controlled input must be validated on the backend.

Examples:

```text
Email
Password
Task title
Task description
Task status
Project ID
User ID
File upload
Comments
Search parameters
Pagination parameters
```

Frontend validation improves UX but does not replace backend validation.

---

# 24. SQL Security

All database queries must use parameterized queries.

Never concatenate user-controlled input directly into SQL.

Correct:

```js
db.execute(
  "SELECT * FROM tasks WHERE id = ?",
  [taskId]
);
```

Incorrect:

```js
db.execute(
  `SELECT * FROM tasks WHERE id = ${taskId}`
);
```

This is mandatory.

---

# 25. File Upload Development

File uploads follow:

```text
React
 ↓
Multipart Request
 ↓
Express
 ↓
Validation
 ↓
Hostinger Filesystem
 ↓
MySQL Metadata
```

Validate:

```text
File type
File size
Filename
Storage location
User permission
```

Never allow arbitrary filesystem paths.

---

# 26. File Storage Rule

Files must be physically stored on the Hostinger server.

MySQL stores metadata.

Example:

```text
Hostinger:
uploads/tasks/a83f2.zip

MySQL:
original_name
stored_name
file_path
mime_type
file_size
uploaded_by
task_id
```

Do not store large binary files directly inside MySQL unless a specific requirement later justifies it.

---

# 27. Activity Logging

Important business actions should generate activity logs.

Examples:

```text
USER_LOGIN
TASK_CREATED
TASK_ASSIGNED
TASK_STATUS_CHANGED
TASK_SUBMITTED_FOR_REVIEW
TASK_APPROVED
TASK_REVISION_REQUESTED
COMMENT_CREATED
FILE_UPLOADED
```

Follow:

```text
ACTIVITY_LOG.md
```

Do not create a separate activity implementation for each module.

---

# 28. Notification Development

Notifications should be generated by backend business operations.

Example:

```text
Task submitted for review
       ↓
Task Service
       ├── Update Task
       ├── Create Activity
       └── Create Notification
```

Do not let React directly create authoritative notifications.

---

# 29. Transactions

Use database transactions when multiple operations must succeed together.

Example:

```text
Task Status Update
       +
Activity Log
       +
Notification
```

If the business operation is atomic, related database writes should be treated atomically.

---

# 30. Task Status Development

Task status transitions must be validated server-side.

Initial lifecycle:

```text
BACKLOG
   ↓
ASSIGNED
   ↓
IN_PROGRESS
   ↓
REVIEW
   ├──→ COMPLETED
   │
   └──→ REVISION_REQUIRED
            ↓
        IN_PROGRESS
```

Do not allow arbitrary status manipulation.

---

# 31. Developer Workflow

Developer functionality must follow:

```text
DEVELOPER_SYSTEM.md
```

Developers should be able to:

```text
View assigned tasks
Update permitted tasks
Start work
Submit for review
See review feedback
Handle revisions
Comment
Upload files
View permitted projects
Receive notifications
```

---

# 32. Dashboard Development

Dashboard implementation must follow:

```text
DASHBOARD.md
```

Dashboard values must come from actual backend/database data.

Never hardcode:

```text
Task counts
Project counts
Notifications
Activity
Progress
```

for production functionality.

---

# 33. Loading States

Every asynchronous page/component should account for loading.

Example:

```text
Loading
   ↓
API Response
   ↓
Render Data
```

Use:

```text
Skeleton
Spinner
Loading text
```

where appropriate.

Avoid showing incorrect placeholder values as real data.

---

# 34. Error States

Every important API-dependent UI should handle:

```text
401
403
404
422
500
Network Error
```

Users should receive understandable messages.

Developers should have enough information in development logs to diagnose the problem.

---

# 35. Empty States

Empty datasets should not look like broken UI.

Examples:

```text
No tasks assigned.
No notifications.
No recent activity.
No projects available.
```

Provide useful context where appropriate.

---

# 36. Logging

Backend logs should help developers diagnose problems.

Log useful information such as:

```text
Request errors
Authentication failures
Unexpected exceptions
Database failures
File operation failures
```

Do not log:

```text
Passwords
Password hashes
Session secrets
API keys
Database passwords
Authentication tokens
```

---

# 37. Environment Variables

Environment-specific configuration must use environment variables.

Examples:

```env
NODE_ENV=
PORT=

DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

SESSION_SECRET=
```

Exact variables must match the authentication/database implementation.

Never commit production secrets.

---

# 38. Environment Separation

At minimum distinguish:

```text
Development
Production
```

Development configuration must not accidentally point to the production database.

---

# 39. Local Development

Typical development process:

```text
Install dependencies
        ↓
Configure .env
        ↓
Configure MySQL
        ↓
Run backend
        ↓
Run React frontend
        ↓
Test application
```

Frontend and backend may run on separate local ports during development.

Example:

```text
React:
http://localhost:5173

Express:
http://localhost:5000
```

Actual ports may differ.

---

# 40. Production Architecture

Production deployment:

```text
pct.permetheon.com
        │
        ▼
React Production Build
        │
        ▼
Express.js Backend
        │
        ├────► MySQL
        │
        └────► Hostinger Filesystem
```

The final Hostinger configuration must be verified against the actual hosting environment.

---

# 41. Production Frontend Build

Before deployment:

```bash
npm run build
```

The production build must complete successfully.

Do not deploy a known-broken frontend build.

---

# 42. Production Backend

Before deployment:

```text
Install production dependencies
Configure environment variables
Configure Node.js application
Configure database connection
Configure filesystem permissions
Start Express application
Verify health/API endpoints
```

Do not expose development configuration in production.

---

# 43. Production Database

Production database credentials must exist only in the production environment.

Never hardcode them inside:

```text
React
JavaScript
Git
Markdown
Frontend configuration
```

---

# 44. Deployment Rule

Do not deploy directly after major code changes without verification.

Recommended:

```text
Code
 ↓
Local Test
 ↓
Build
 ↓
Backend Test
 ↓
Database Test
 ↓
Production Deployment
 ↓
Smoke Test
```

---

# 45. Production Smoke Test

After deployment verify:

```text
[ ] Domain loads
[ ] Login works
[ ] Logout works
[ ] Dashboard loads
[ ] API responds
[ ] MySQL connection works
[ ] Task creation works
[ ] Task update works
[ ] File upload works
[ ] File access works
[ ] Activity logging works
[ ] Notifications work
```

Only test features that have already been implemented.

---

# 46. Git Workflow

Use Git for source control.

Recommended workflow:

```text
main
 │
 └── feature/<feature-name>
```

Examples:

```text
feature/authentication
feature/task-management
feature/dashboard
feature/file-upload
```

---

# 47. Commit Standards

Commits should describe the actual change.

Good:

```text
feat: add task status workflow
fix: prevent duplicate task submissions
feat: add developer dashboard
fix: validate task ownership
refactor: separate task service
docs: update database specification
```

Avoid:

```text
update
changes
final
final2
new
test
```

---

# 48. Small Commits

Prefer focused commits.

One commit should ideally represent one logical change.

Avoid giant commits containing:

```text
Authentication
Dashboard
Tasks
Database
UI redesign
```

all at once.

---

# 49. Before Committing

Check:

```text
[ ] Application runs
[ ] No obvious console errors
[ ] No server crashes
[ ] Relevant feature tested
[ ] No secrets included
[ ] No debug code left
[ ] No unnecessary files
[ ] Build succeeds where applicable
```

---

# 50. Debugging Workflow

When something breaks:

```text
1. Reproduce
2. Identify exact failure
3. Check browser console
4. Check network request
5. Check Express logs
6. Check database query/error
7. Identify root cause
8. Apply smallest correct fix
9. Retest
10. Verify related functionality
```

Do not randomly modify unrelated files.

---

# 51. Frontend Debugging

Check:

```text
Browser Console
Network Tab
React errors
API response
Component state
Route
Authentication state
```

When an API request fails, inspect the actual request/response before changing frontend logic.

---

# 52. Backend Debugging

Check:

```text
Express logs
Request parameters
Authentication state
Authorization result
Validation
Database query
Database response
Filesystem operation
```

Never expose sensitive internal errors to users just to make debugging easier.

---

# 53. Database Debugging

When database operations fail:

```text
Check connection
 ↓
Check database/table
 ↓
Check query
 ↓
Check parameters
 ↓
Check constraints
 ↓
Check foreign keys
 ↓
Check indexes if performance-related
```

Do not immediately modify the schema to solve an unknown query problem.

---

# 54. Regression Testing

After fixing a feature, test related functionality.

Example:

If task status handling changes:

```text
Test:
Task assignment
Task status
Review
Revision
Activity
Notifications
Dashboard counts
```

A local fix should not silently break dependent modules.

---

# 55. Testing Priorities

At minimum test:

```text
Authentication
Authorization
Tasks
Projects
File uploads
Reviews
Notifications
Activity logs
Dashboard
```

Security-sensitive backend logic receives priority.

---

# 56. API Testing

Test APIs independently where practical.

Verify:

```text
Successful request
Invalid request
Unauthenticated request
Unauthorized request
Missing resource
Invalid resource
Database failure
```

---

# 57. Security Testing

Before production deployment verify:

```text
[ ] SQL injection protection
[ ] Authentication enforcement
[ ] Authorization enforcement
[ ] Resource ownership checks
[ ] File path validation
[ ] File type validation
[ ] Sensitive error suppression
[ ] Secret protection
[ ] Input validation
```

---

# 58. No Direct Client Trust

Never trust:

```text
User ID
Role
Project ID
Task ID
Permission
Status
```

simply because the frontend sent it.

The backend must verify all security-sensitive values.

---

# 59. Documentation Updates

When implementation changes architecture or behavior, update the relevant `.md` document.

Examples:

```text
Database change
→ DATABASE.md

API change
→ API.md

Authentication change
→ AUTHENTICATION.md

Architecture change
→ ARCHITECTURE.md
→ ARCHITECTURE_LOG.md

Activity change
→ ACTIVITY_LOG.md

Dashboard change
→ DASHBOARD.md

Developer workflow change
→ DEVELOPER_SYSTEM.md
```

---

# 60. Architecture Log

Significant architecture decisions should be recorded in:

```text
ARCHITECTURE_LOG.md
```

Examples:

```text
Changing authentication approach
Adding new storage strategy
Changing database relationship
Introducing new major module
Changing deployment architecture
```

Do not silently make major architectural changes.

---

# 61. Scope Control

Do not add features that are not part of the current requirement.

Avoid unnecessary:

```text
AI systems
External APIs
WebSockets
Complex state libraries
Third-party analytics
Microservices
Over-engineered abstractions
```

PCT should remain a simple internal production CRM/tool.

---

# 62. Dependency Rules

Before installing a new package:

1. Check whether the functionality already exists.
2. Check whether it can be implemented simply.
3. Check package maintenance/status.
4. Check security implications.
5. Confirm it does not unnecessarily increase complexity.

Do not install packages for trivial functionality.

---

# 63. No Unnecessary Framework Changes

Do not replace the existing stack without a documented architectural reason.

Current stack:

```text
React 18+
Vite
Tailwind CSS
Express.js
MySQL
Node.js
```

Major stack changes require architectural review.

---

# 64. Code Quality

Implementation should be:

```text
Readable
Predictable
Modular
Reusable where appropriate
Secure
Testable
```

Do not optimize prematurely.

Do not create abstractions that have only one trivial use unless they provide a clear architectural benefit.

---

# 65. Dead Code

Remove:

```text
Unused imports
Unused variables
Unused components
Unused routes
Unused services
Unused database logic
Unused dependencies
Debugging code
```

Do not leave abandoned implementations in production.

---

# 66. Console Output

Development logging is acceptable while debugging.

Before production:

```text
Remove unnecessary console.log()
Remove sensitive debugging output
Keep intentional server-side error logging
```

Do not expose internal information through browser console logs.

---

# 67. UI Consistency

All modules should use the same:

```text
Typography
Spacing
Buttons
Forms
Cards
Tables
Modals
Status indicators
Navigation
```

Use shared components where appropriate.

Do not build every module with a different visual language.

---

# 68. Responsive Development

Primary target:

```text
Desktop
Laptop
```

Also support:

```text
Tablet
```

Responsive behavior should be handled through Tailwind utilities and normal responsive layout techniques.

---

# 69. Performance

Avoid unnecessary performance optimization.

Focus on obvious issues:

```text
Large API responses
Unbounded database queries
Repeated requests
Large file downloads
Unnecessary React re-renders
Huge component bundles
```

Measure before introducing complicated optimization.

---

# 70. Deployment Storage

Uploaded files must use the Hostinger filesystem.

Do not accidentally store uploads inside the React frontend build directory.

Example:

```text
Correct:
server/uploads/

Incorrect:
client/public/uploads/
```

Production storage paths must be outside the frontend static build where appropriate.

---

# 71. Production File Access

Uploaded files should be served through a controlled backend route or secure mechanism when access control is required.

Do not expose sensitive files through a publicly guessable URL.

---

# 72. Backup Awareness

Before major production database changes:

```text
Verify backup
 ↓
Apply change
 ↓
Verify application
```

Do not perform destructive database operations without a recovery strategy.

---

# 73. Feature Completion Definition

A feature is NOT complete simply because the UI exists.

A feature is complete when:

```text
Frontend
   +
Backend
   +
Database
   +
Authorization
   +
Validation
   +
Error Handling
   +
Activity/Notifications where required
   +
Testing
   +
Documentation
```

are complete.

---

# 74. Definition of Done

Before marking a development task as complete:

```text
[ ] Requirement implemented
[ ] Existing architecture respected
[ ] Database changes completed
[ ] API implemented
[ ] Authorization implemented
[ ] Frontend implemented
[ ] Loading state implemented
[ ] Error handling implemented
[ ] Empty state implemented where needed
[ ] Relevant activity logged
[ ] Notifications implemented where required
[ ] Feature tested
[ ] Related functionality regression-tested
[ ] No obvious console errors
[ ] No sensitive data exposed
[ ] No dead code introduced
[ ] Production build passes
[ ] Documentation updated if necessary
```

---

# 75. Final Development Principle

> **Build PCT incrementally, verify every layer, keep the architecture simple, and never consider a feature finished just because the frontend looks finished.**

Every feature must work as a complete system:

```text
UI
 ↓
API
 ↓
Business Logic
 ↓
Database / Filesystem
 ↓
Activity / Notifications
 ↓
Verification
```

PCT should remain a maintainable internal production system rather than becoming an over-engineered application.
