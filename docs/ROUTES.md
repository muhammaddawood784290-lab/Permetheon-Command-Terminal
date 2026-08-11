# PCT — Route System

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Document Type:** Routing Specification
**Status:** Active Development
**Version:** 1.0

---

# 1. Purpose

This document defines the routing structure for PCT.

It covers:

```text
Frontend Routes
Backend API Routes
Authentication Routes
Protected Routes
Public Routes
Route Authorization
Route Naming
404 Handling
```

The purpose is to keep routing predictable and consistent across the entire application.

---

# 2. Routing Architecture

PCT has two routing layers.

```text
Browser
   ↓
React Router
   ↓
React Page
   ↓
Express API
   ↓
API Route
   ↓
Controller
   ↓
Service
   ↓
MySQL
```

Frontend routing controls **pages**.

Backend routing controls **data and actions**.

---

# 3. Domain

Production domain:

```text
https://pct.permetheon.com
```

Frontend application:

```text
https://pct.permetheon.com/
```

Backend API:

```text
https://pct.permetheon.com/api/
```

The API should remain under `/api`.

---

# 4. Frontend Routing

PCT uses React Router.

Recommended base structure:

```text
/
├── login
├── dashboard
├── projects
├── projects/:projectId
├── tasks
├── tasks/:taskId
├── tasks/:taskId/review
├── reviews
├── reviews/:reviewId
├── developers
├── developers/:developerId
├── reports
├── activity
├── notifications
├── settings
└── 404
```

Exact pages should only be implemented when corresponding functionality exists.

---

# 5. Public Routes

The initial public route should be:

```text
/login
```

Optional future public routes may include:

```text
/forgot-password
/reset-password
```

PCT does not require a public marketing website.

---

# 6. Protected Routes

All internal application routes require authentication.

Protected examples:

```text
/dashboard
/projects
/tasks
/reviews
/developers
/reports
/activity
/notifications
/settings
```

Unauthenticated users attempting to access these routes should be redirected to:

```text
/login
```

---

# 7. Login Route

```text
/login
```

Purpose:

```text
User Authentication
```

Expected behavior:

```text
Unauthenticated
    ↓
/login

Successful Login
    ↓
/ dashboard
```

If an already authenticated user opens `/login`, redirect them to the appropriate authenticated landing page.

---

# 8. Dashboard Route

```text
/dashboard
```

Purpose:

```text
Main internal workspace
```

The Dashboard may contain:

```text
Project Summary
Task Summary
Review Queue
Notifications
Deadlines
Workload
Recent Activity
```

Detailed Dashboard behavior is defined in:

```text
DASHBOARD.md
```

---

# 9. Projects Route

List:

```text
/projects
```

Purpose:

```text
View authorized projects
```

Possible actions:

```text
Search
Filter
Create
Open Project
```

Action availability depends on permissions.

---

# 10. Project Detail Route

```text
/projects/:projectId
```

Example:

```text
/projects/42
```

The page may contain:

```text
Project Information
Members
Tasks
Files
Activity
Progress
```

The backend must verify that the authenticated user has access to the project.

---

# 11. Project Sub-Routes

Optional nested routes may include:

```text
/projects/:projectId/tasks
/projects/:projectId/files
/projects/:projectId/activity
```

Only create dedicated routes where they provide meaningful UX.

Do not create unnecessary route complexity.

---

# 12. Tasks Route

```text
/tasks
```

Purpose:

```text
Task Management
```

Possible features:

```text
Task List
Filters
Search
Status
Priority
Developer
Project
Deadline
```

---

# 13. Task Detail Route

```text
/tasks/:taskId
```

Example:

```text
/tasks/101
```

Task detail may contain:

```text
Task Information
Project
Developer
Status
Priority
Deadline
Comments
Files
Activity
Review Status
```

---

# 14. Task Review Route

Recommended:

```text
/tasks/:taskId/review
```

Purpose:

```text
Review the current task submission
```

Access depends on review permissions.

Developers may use this route to inspect their review feedback where authorized.

---

# 15. Reviews Route

```text
/reviews
```

Purpose:

```text
Review Queue
```

Possible sections:

```text
My Review Queue
Pending Reviews
Recently Approved
Revision Required
Review History
```

---

# 16. Review Detail Route

```text
/reviews/:reviewId
```

Example:

```text
/reviews/57
```

The page should show:

```text
Task
Project
Developer
Reviewer
Review Status
Submitted Work
Comments
Review History
Decision
```

---

# 17. Developer Route

Developer/team overview:

```text
/developers
```

Purpose:

```text
View authorized developers and workload
```

Access is role-controlled.

Developers should not automatically receive unrestricted access to other developers' private information.

---

# 18. Developer Detail Route

```text
/developers/:developerId
```

Example:

```text
/developers/12
```

Possible information:

```text
Developer Name
Assigned Tasks
Current Work
Review Queue
Completed Tasks
Workload
```

The exact visibility depends on role and permissions.

---

# 19. Reports Route

```text
/reports
```

Purpose:

```text
Operational Reporting
```

Possible sections:

```text
Overview
Projects
Tasks
Developers
Reviews
Workload
Deadlines
Activity
```

Detailed behavior:

```text
REPORTS.md
```

---

# 20. Activity Route

```text
/activity
```

Purpose:

```text
System Activity / Audit History
```

Possible filters:

```text
User
Project
Task
Action
Date
```

Detailed behavior:

```text
ACTIVITY_LOG.md
```

---

# 21. Notifications Route

```text
/notifications
```

Purpose:

```text
View User Notifications
```

Possible features:

```text
Unread
All
Mark as Read
Open Related Resource
```

---

# 22. Settings Route

```text
/settings
```

Purpose:

```text
Application / User Settings
```

Possible sections:

```text
Profile
Account
Preferences
System Settings
```

The visibility of settings depends on role.

---

# 23. User Management Route

Admin-only or authorized route:

```text
/settings/users
```

Possible actions:

```text
View Users
Create User
Edit User
Disable User
Change Role
```

Authorization must be enforced by the backend.

---

# 24. Role Management Route

If implemented:

```text
/settings/roles
```

This should be restricted to Admin.

PCT V1 does not require a fully dynamic permission editor.

Core roles should remain controlled.

---

# 25. Frontend Route Protection

Recommended structure:

```text
App
 └── AuthProvider
      └── ProtectedRoute
           └── Application Routes
```

Conceptually:

```text
ProtectedRoute
    ↓
Is User Authenticated?
    ↓
NO  → /login
YES → Continue
```

---

# 26. Permission-Based Frontend Routes

Some pages require specific permissions.

Example:

```text
/reports
```

may require:

```text
report.view
```

Another:

```text
/settings/users
```

may require:

```text
user.view
```

Frontend should hide or redirect unauthorized users.

Backend must still enforce authorization.

---

# 27. Role-Based Navigation

Navigation should adapt to the authenticated user's permissions.

Example:

### Admin

```text
Dashboard
Projects
Tasks
Reviews
Developers
Reports
Activity
Notifications
Settings
```

### Team Lead

```text
Dashboard
Projects
Tasks
Reviews
Developers
Reports
Activity
Notifications
Settings
```

### Developer

```text
Dashboard
My Projects
My Tasks
My Reviews
Notifications
```

Exact navigation should be permission-driven rather than hardcoded purely by role.

---

# 28. Route Guards

Recommended frontend components:

```text
client/src/
└── components/
    └── auth/
        ├── ProtectedRoute.jsx
        └── PermissionRoute.jsx
```

Possible behavior:

```text
ProtectedRoute
    ↓
Authentication

PermissionRoute
    ↓
Permission
```

---

# 29. Unauthorized Frontend Route

If authenticated but lacking permission:

```text
/403
```

Recommended page:

```text
Access Denied
You do not have permission to access this page.
```

---

# 30. Not Found Route

Unknown frontend routes should display:

```text
/404
```

Example:

```text
/projects/does-not-exist
```

If the project ID does not exist, the page should provide a useful not-found state rather than crashing.

---

# 31. Backend API Base Path

All application APIs should use:

```text
/api
```

Example:

```text
/api/projects
/api/tasks
/api/reviews
```

Do not mix:

```text
/api
/backend
/server
/data
```

for normal application endpoints.

Use one consistent API namespace.

---

# 32. Authentication API Routes

Recommended:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Optional future:

```text
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

Only implement endpoints actually required by the authentication strategy.

---

# 33. User API Routes

Recommended:

```text
GET    /api/users
GET    /api/users/:id
POST   /api/users
PATCH  /api/users/:id
PATCH  /api/users/:id/status
PATCH  /api/users/:id/role
```

Access is permission-controlled.

---

# 34. Project API Routes

Recommended:

```text
GET    /api/projects
GET    /api/projects/:id
POST   /api/projects
PATCH  /api/projects/:id
PATCH  /api/projects/:id/status
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId
```

Exact implementation should follow `API.md`.

---

# 35. Task API Routes

Recommended:

```text
GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks
PATCH  /api/tasks/:id
PATCH  /api/tasks/:id/status
PATCH  /api/tasks/:id/assign
DELETE /api/tasks/:id
```

Review submission:

```text
POST /api/tasks/:id/reviews
```

---

# 36. Review API Routes

Recommended:

```text
GET   /api/reviews
GET   /api/reviews/:id
PATCH /api/reviews/:id/start
PATCH /api/reviews/:id/approve
PATCH /api/reviews/:id/revision
POST  /api/reviews/:id/comments
```

---

# 37. Developer API Routes

Recommended:

```text
GET /api/developers
GET /api/developers/:id
GET /api/developers/:id/tasks
GET /api/developers/:id/workload
```

These routes must respect developer visibility permissions.

---

# 38. Reports API Routes

Recommended:

```text
GET /api/reports/overview
GET /api/reports/projects
GET /api/reports/tasks
GET /api/reports/developers
GET /api/reports/reviews
GET /api/reports/workload
GET /api/reports/deadlines
GET /api/reports/activity
```

Exports, if implemented:

```text
GET /api/reports/:report/export
```

---

# 39. Activity API Routes

Recommended:

```text
GET /api/activity
GET /api/activity/:id
```

Activity access must be permission-controlled.

---

# 40. Notification API Routes

Recommended:

```text
GET   /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

Users should normally only modify their own notification state.

---

# 41. File API Routes

If file management is implemented:

```text
GET    /api/files/:id
POST   /api/files
DELETE /api/files/:id
```

File access must be validated against the related project/task.

Files must never become publicly accessible simply because the file URL is known.

---

# 42. API Route Organization

Recommended backend structure:

```text
server/
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── projectRoutes.js
│   ├── taskRoutes.js
│   ├── reviewRoutes.js
│   ├── developerRoutes.js
│   ├── reportRoutes.js
│   ├── activityRoutes.js
│   ├── notificationRoutes.js
│   └── fileRoutes.js
│
└── server.js
```

---

# 43. Route → Controller → Service

Backend routes should remain thin.

Recommended:

```text
Request
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Service
   ↓
MySQL
```

Do not place large business logic directly inside route files.

---

# 44. Route Middleware

Protected routes should generally follow:

```text
router
   ↓
authenticate
   ↓
requirePermission
   ↓
controller
```

Example:

```js
router.patch(
  "/projects/:id",
  authenticate,
  requirePermission("project.update"),
  updateProject
);
```

---

# 45. Resource Authorization

Permission alone is not always enough.

Example:

```text
Developer
   ↓
task.update
   ↓
Task #100
   ↓
Is Task #100 accessible to this developer?
   ↓
YES → Update
NO  → 403
```

Resource scope must be checked by the backend.

---

# 46. Route Parameter Validation

Routes containing IDs must validate parameters.

Example:

```text
/projects/:id
/tasks/:id
/reviews/:id
```

Invalid IDs should return a controlled API error.

Do not allow invalid parameters to generate database errors exposed to the client.

---

# 47. Query Parameters

List routes may support query parameters.

Example:

```text
/api/tasks?status=IN_PROGRESS
```

Possible parameters:

```text
search
status
priority
project
developer
page
limit
sort
order
```

Only supported parameters should be accepted.

---

# 48. Pagination

List endpoints should support pagination where required.

Example:

```text
/api/tasks?page=1&limit=20
```

The backend should enforce reasonable maximum limits.

Example:

```text
limit <= 100
```

Exact maximum may be adjusted during implementation.

---

# 49. Filtering

Filtering should happen in MySQL through backend queries.

Incorrect:

```text
GET all tasks
   ↓
React filters 50,000 tasks
```

Correct:

```text
React filter
   ↓
Express
   ↓
MySQL filtered query
   ↓
React
```

---

# 50. Sorting

Sorting parameters must be validated.

Example:

```text
/api/tasks?sort=deadline&order=asc
```

The backend must whitelist allowed sort fields.

Never directly insert arbitrary user input into SQL `ORDER BY`.

---

# 51. Route Naming Convention

Use plural nouns for resource collections.

Good:

```text
/api/projects
/api/tasks
/api/reviews
/api/users
```

Avoid:

```text
/api/getProjects
/api/createTask
/api/deleteReview
```

HTTP methods already communicate the action.

---

# 52. HTTP Method Convention

Use:

```text
GET
```

for reading.

```text
POST
```

for creating.

```text
PATCH
```

for partial updates.

```text
DELETE
```

for deletion.

---

# 53. Route Consistency

Do not create inconsistent endpoint patterns.

Good:

```text
/api/projects/:id
/api/tasks/:id
/api/reviews/:id
```

Avoid mixing:

```text
/api/project/:id
/api/task/:taskId
/api/review/id/:id
```

unless there is a documented reason.

---

# 54. Error Handling

All API routes should use centralized error handling.

Recommended:

```text
Request
   ↓
Route
   ↓
Controller
   ↓
Error
   ↓
Global Error Handler
   ↓
Consistent JSON Response
```

---

# 55. Backend 404

Unknown API routes should return:

```http
404 Not Found
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "API route not found."
  }
}
```

Exact format must follow `API.md`.

---

# 56. Frontend API Calls

React should use a centralized API/service layer.

Recommended:

```text
client/src/
└── services/
    ├── api.js
    ├── authService.js
    ├── projectService.js
    ├── taskService.js
    ├── reviewService.js
    ├── reportService.js
    └── notificationService.js
```

Components should not contain repeated raw API configuration.

---

# 57. API Base URL

The frontend should use an environment/configurable API base URL.

Production concept:

```text
https://pct.permetheon.com/api
```

Do not hardcode production URLs throughout React components.

---

# 58. SPA Routing on Hostinger

Because PCT uses React, production hosting must support SPA fallback behavior.

When a user directly opens:

```text
https://pct.permetheon.com/projects/42
```

the server must serve the React application's entry point rather than returning a server 404.

The deployment configuration must therefore support React Router history fallback.

---

# 59. API and React Hosting

Recommended production structure:

```text
pct.permetheon.com
        │
        ├── React Frontend
        │
        └── /api
              ↓
          Express Backend
              ↓
             MySQL
```

The exact Hostinger Node.js deployment configuration should follow the actual hosting environment.

---

# 60. No Direct MySQL Access

React must never connect directly to MySQL.

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

Database credentials must remain server-side.

---

# 61. Route Security

All protected API routes must enforce:

```text
Authentication
Authorization
Resource Scope
Input Validation
```

Do not rely on obscurity.

For example:

```text
/api/projects/42
```

must remain protected even if someone manually types the URL.

---

# 62. Route Logging

Important backend requests may be logged through the application's existing logging system.

Do not log:

```text
Passwords
Tokens
Secrets
Database Credentials
Sensitive Authentication Data
```

Activity logging should be reserved for meaningful application actions.

---

# 63. Route Documentation

Whenever a new API route is created, update:

```text
API.md
```

Whenever a new frontend page is created, update:

```text
ROUTE.md
```

Do not allow implementation and documentation to drift apart.

---

# 64. Route Change Process

When adding a route:

```text
New Feature
   ↓
Define Frontend Route
   ↓
Define API Route
   ↓
Define Permission
   ↓
Define Controller
   ↓
Define Service
   ↓
Implement
   ↓
Test
   ↓
Update Documentation
```

---

# 65. Route Testing Checklist

### Frontend

```text
[ ] Public routes work
[ ] Protected routes redirect unauthenticated users
[ ] Authorized users can access correct pages
[ ] Unauthorized users receive correct behavior
[ ] 404 route works
[ ] Direct URL navigation works
[ ] Browser refresh works on nested routes
```

### Backend

```text
[ ] API routes respond correctly
[ ] Authentication is enforced
[ ] Permissions are enforced
[ ] Resource scope is enforced
[ ] Invalid IDs are handled
[ ] Invalid query parameters are handled
[ ] Pagination works
[ ] Filtering works
[ ] Sorting works
[ ] API 404 works
[ ] Errors use consistent format
```

---

# 66. Definition of Done

Routing is complete when:

```text
[ ] React routes are defined
[ ] Protected routes work
[ ] Permission-based access works
[ ] Backend API routes are defined
[ ] Controllers are connected
[ ] Services are connected
[ ] Authentication middleware works
[ ] Permission middleware works
[ ] Resource authorization works
[ ] 404 handling works
[ ] SPA refresh works on Hostinger
[ ] API uses /api namespace
[ ] No direct frontend-to-MySQL access exists
[ ] API documentation is updated
[ ] Route documentation matches implementation
[ ] Production build succeeds
```

---

# 67. Final Route Architecture

PCT routing follows this structure:

```text
                    pct.permetheon.com
                           │
              ┌────────────┴────────────┐
              │                         │
          React Router              /api/*
              │                         │
              ▼                         ▼
          React Pages              Express Routes
                                        │
                                        ▼
                                   Middleware
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                       Authentication       Permissions
                              │                   │
                              └─────────┬─────────┘
                                        │
                                        ▼
                                    Controller
                                        │
                                        ▼
                                     Service
                                        │
                                        ▼
                                      MySQL
```

> **Frontend routes control navigation. Backend routes control application data and actions. Authentication, permissions, and resource scope must be enforced server-side for every protected operation.**
