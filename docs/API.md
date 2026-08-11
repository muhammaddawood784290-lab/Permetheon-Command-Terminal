# PCT — API Documentation

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**API Type:** Internal REST API
**Backend:** Node.js + Express.js
**Database:** MySQL
**Status:** Active
**Version:** 1.0

---

# 1. Overview

PCT uses an internal REST-style backend built with Express.js.

The API exists only to connect the React frontend with the PCT backend and MySQL database.

PCT does **not** depend on external third-party APIs for its core functionality.

```text
React Frontend
      │
      │ HTTP Request
      ▼
Express Backend
      │
      ▼
Business Logic
      │
      ▼
MySQL
```

---

# 2. API Rules

All backend routes must follow these principles:

* Use HTTP methods correctly.
* Validate incoming data.
* Authenticate protected requests.
* Verify permissions on the backend.
* Return predictable JSON responses.
* Never expose sensitive database information.
* Never expose passwords or authentication secrets.
* Use appropriate HTTP status codes.
* Keep route handlers lightweight.
* Business logic belongs in services/controllers rather than directly inside routes.

---

# 3. Base URL

Development:

```text
http://localhost:5000
```

Production:

```text
https://pct.permetheon.com
```

The exact production API prefix may be configured during deployment.

Recommended structure:

```text
/api
```

Therefore:

```text
https://pct.permetheon.com/api
```

---

# 4. Response Format

Successful responses should use a consistent structure.

Example:

```json
{
  "success": true,
  "message": "Task retrieved successfully.",
  "data": {}
}
```

For collections:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Task not found."
}
```

Validation errors may include:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "title": "Title is required."
  }
}
```

---

# 5. HTTP Status Codes

Use standard status codes.

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 200    | Successful request                       |
| 201    | Resource created                         |
| 204    | Successful request with no response body |
| 400    | Bad request                              |
| 401    | Unauthenticated                          |
| 403    | Unauthorized                             |
| 404    | Resource not found                       |
| 409    | Conflict                                 |
| 422    | Validation error                         |
| 500    | Internal server error                    |

Do not return `200` for failed operations merely to simplify frontend handling.

---

# 6. Authentication API

Base:

```text
/api/auth
```

## POST /login

Authenticate a PCT user.

Request:

```json
{
  "email": "developer@example.com",
  "password": "password"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": 1,
      "name": "Developer",
      "email": "developer@example.com",
      "role": "DEVELOPER"
    }
  }
}
```

Authentication state must be handled securely.

---

## POST /logout

Logs the current user out.

Response:

```json
{
  "success": true,
  "message": "Logout successful."
}
```

---

## GET /me

Returns the currently authenticated user.

Response:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Developer",
    "email": "developer@example.com",
    "role": "DEVELOPER"
  }
}
```

---

# 7. User API

Base:

```text
/api/users
```

Admin-only operations must be protected by role middleware.

---

## GET /users

Returns users.

Supported filters may include:

```text
role
status
search
```

Example:

```text
GET /api/users?role=DEVELOPER
```

---

## GET /users/:id

Returns a specific user.

---

## POST /users

Creates a new user.

Admin only.

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "DEVELOPER",
  "password": "temporary-password"
}
```

---

## PUT /users/:id

Updates a user.

---

## DELETE /users/:id

Deactivates or removes a user according to the application's user-management policy.

Hard deletion should be avoided when historical records depend on the user.

---

# 8. Project API

Base:

```text
/api/projects
```

---

## GET /projects

Returns projects.

Optional filters:

```text
status
search
member
priority
```

Example:

```text
GET /api/projects?status=ACTIVE
```

---

## GET /projects/:id

Returns project details.

The response may include:

* Project information
* Members
* Tasks
* Progress
* Files
* Recent activity

---

## POST /projects

Creates a project.

Example:

```json
{
  "name": "Permetheon Website",
  "description": "Company website development",
  "status": "ACTIVE",
  "priority": "HIGH"
}
```

---

## PUT /projects/:id

Updates project information.

---

## DELETE /projects/:id

Archives/deactivates a project.

Projects should preferably be archived rather than permanently deleted when historical task records exist.

---

## POST /projects/:id/members

Adds a developer/team member to a project.

Request:

```json
{
  "userId": 12
}
```

---

## DELETE /projects/:id/members/:userId

Removes a member from a project.

---

# 9. Task API

Base:

```text
/api/tasks
```

Tasks are one of the primary PCT resources.

---

## GET /tasks

Returns tasks.

Supported filters:

```text
project
assignee
status
priority
deadline
search
```

Example:

```text
GET /api/tasks?status=IN_PROGRESS
```

---

## GET /tasks/:id

Returns complete task details.

Possible response data:

```text
Task
Project
Assignee
Comments
Reviews
Attachments
Activity
```

---

## POST /tasks

Creates a task.

Example:

```json
{
  "title": "Build authentication page",
  "description": "Create login UI and authentication flow.",
  "projectId": 1,
  "assigneeId": 5,
  "priority": "HIGH",
  "deadline": "2026-08-20"
}
```

---

## PUT /tasks/:id

Updates a task.

---

## PATCH /tasks/:id/status

Updates task status.

Example:

```json
{
  "status": "IN_PROGRESS"
}
```

Valid statuses:

```text
BACKLOG
ASSIGNED
IN_PROGRESS
REVIEW
REVISION_REQUIRED
COMPLETED
```

Every status change should create an activity record.

---

## PATCH /tasks/:id/priority

Updates task priority.

Example:

```json
{
  "priority": "URGENT"
}
```

---

## PATCH /tasks/:id/assignee

Assigns or reassigns a task.

Example:

```json
{
  "assigneeId": 5
}
```

Assignment changes must be logged.

---

## DELETE /tasks/:id

Archives/deletes a task according to system rules.

Completed historical tasks should preferably be retained.

---

# 10. Task Comments API

Base:

```text
/api/tasks/:taskId/comments
```

---

## GET /tasks/:taskId/comments

Returns comments for a task.

---

## POST /tasks/:taskId/comments

Adds a comment.

Request:

```json
{
  "content": "Authentication page is ready for review."
}
```

---

## PUT /tasks/:taskId/comments/:commentId

Updates an existing comment where permitted.

---

## DELETE /tasks/:taskId/comments/:commentId

Deletes a comment where permitted.

---

# 11. Task Review API

Base:

```text
/api/reviews
```

---

## GET /reviews

Returns review items accessible to the current user.

---

## GET /reviews/:id

Returns review details.

---

## POST /tasks/:taskId/review

Submits a task for review.

Example:

```json
{
  "note": "Implementation completed. Ready for review."
}
```

---

## POST /reviews/:id/approve

Approves a task.

Result:

```text
Task status → COMPLETED
```

Approval must be logged.

---

## POST /reviews/:id/revision

Requests revision.

Request:

```json
{
  "feedback": "Fix the mobile navigation before approval."
}
```

Result:

```text
Task status → REVISION_REQUIRED
```

The developer should be able to continue work after revision.

---

# 12. Developer API

Base:

```text
/api/developers
```

Developer information may be derived from users with the `DEVELOPER` role.

---

## GET /developers

Returns developers.

Possible filters:

```text
status
search
project
```

---

## GET /developers/:id

Returns developer profile and relevant operational information.

Possible data:

```text
Profile
Active Tasks
Completed Tasks
Projects
Workload
Recent Activity
```

---

## GET /developers/:id/tasks

Returns tasks assigned to a developer.

---

## GET /developers/:id/projects

Returns projects associated with a developer.

---

# 13. My Workspace API

Base:

```text
/api/workspace
```

This endpoint is designed for the logged-in developer.

---

## GET /workspace

Returns the current user's workspace.

Possible data:

```text
Today's Tasks
Active Tasks
Overdue Tasks
Upcoming Deadlines
Pending Reviews
Recent Activity
Notifications
```

This endpoint should use the authenticated user rather than accepting an arbitrary user ID from the frontend.

---

# 14. Notification API

Base:

```text
/api/notifications
```

---

## GET /notifications

Returns notifications for the current user.

---

## GET /notifications/unread

Returns unread notifications.

---

## PATCH /notifications/:id/read

Marks a notification as read.

---

## PATCH /notifications/read-all

Marks all available notifications as read.

---

## DELETE /notifications/:id

Deletes a notification if permitted.

---

# 15. Activity API

Base:

```text
/api/activity
```

---

## GET /activity

Returns activity records available to the current user.

Admins and authorized leads may have broader access.

Supported filters:

```text
user
action
entity
date
project
task
```

---

## GET /activity/:id

Returns a specific activity record.

Activity records should generally be immutable.

---

# 16. File API

Base:

```text
/api/files
```

Files are stored on Hostinger.

The API manages file metadata and secure access.

---

## POST /files/upload

Uploads a file.

The backend must:

1. Validate the file.
2. Validate file type.
3. Validate file size.
4. Generate a safe filename.
5. Store the file in the correct Hostinger directory.
6. Save metadata in MySQL.
7. Associate the file with its related entity.
8. Record the upload activity.

---

## GET /files/:id

Returns or securely serves a file that the authenticated user has permission to access.

---

## DELETE /files/:id

Deletes a file where permitted.

The system should remove both:

```text
Physical file
+
Database metadata
```

Deletion failures must be handled safely.

---

# 17. Reports API

Base:

```text
/api/reports
```

Reports should be accessible according to role.

---

## GET /reports/overview

Returns high-level operational statistics.

Possible data:

```text
Total Projects
Active Projects
Total Tasks
Completed Tasks
Overdue Tasks
Pending Reviews
Active Developers
```

---

## GET /reports/tasks

Returns task-related statistics.

Possible filters:

```text
dateFrom
dateTo
project
developer
status
```

---

## GET /reports/developers

Returns developer workload/performance statistics.

Possible data:

```text
Assigned Tasks
Completed Tasks
Overdue Tasks
Completion Rate
Active Projects
```

---

# 18. Dashboard API

Base:

```text
/api/dashboard
```

---

## GET /dashboard

Returns dashboard data required by the authenticated user.

Admin dashboard may include:

```text
Projects
Tasks
Developers
Reviews
Overdue Work
Recent Activity
```

Developer dashboard may include:

```text
My Tasks
Today's Tasks
Upcoming Deadlines
Overdue Tasks
Pending Reviews
Notifications
```

The backend should return only data appropriate to the user's role.

---

# 19. Settings API

Base:

```text
/api/settings
```

Settings should only expose configuration that the current role is permitted to access.

---

## GET /settings

Returns available settings.

---

## PUT /settings

Updates permitted settings.

Sensitive configuration must never be returned to the frontend unnecessarily.

---

# 20. Authentication Requirements

All protected endpoints must verify authentication.

Example:

```text id="3jy1xv"
Request
   ↓
Authentication Middleware
   ↓
Authenticated?
   ├── NO → 401
   │
   └── YES
        ↓
   Role Middleware
        ↓
   Permission Check
        ↓
   Controller
```

Authentication must be performed server-side.

---

# 21. Permission Requirements

Frontend visibility does not equal authorization.

For example:

A developer may not see the "Delete User" button.

However, the backend must ALSO reject:

```text
DELETE /api/users/:id
```

when the requester is not authorized.

Every sensitive operation must have backend permission checks.

---

# 22. Validation

All user-provided input must be validated.

Validation applies to:

* Login
* User creation
* User updates
* Projects
* Tasks
* Comments
* Reviews
* File uploads
* Filters
* Settings

Invalid data must not reach database operations unchecked.

---

# 23. Pagination

Large collections should support pagination.

Example:

```text
GET /api/tasks?page=1&limit=20
```

Default values should be reasonable.

The backend must prevent extremely large arbitrary limits.

---

# 24. Search and Filtering

Search should be handled by the backend for database-backed collections.

Examples:

```text
GET /api/tasks?search=authentication

GET /api/projects?search=website

GET /api/developers?search=ahmed
```

Filtering should be combined with pagination where appropriate.

---

# 25. API Security Rules

The following are mandatory:

* Never trust user IDs supplied by the frontend for permission decisions.
* Always identify the authenticated user from the authentication context.
* Never return passwords.
* Never return password hashes.
* Never expose environment variables.
* Never expose database credentials.
* Validate file uploads.
* Prevent path traversal.
* Prevent SQL injection.
* Restrict administrative endpoints.
* Sanitize or safely render user-generated content.
* Use secure authentication cookies/session handling in production.

---

# 26. File Security

Uploaded files must not automatically become executable server-side content.

The upload system must:

* Restrict dangerous extensions.
* Validate MIME types.
* Sanitize filenames.
* Generate internal stored filenames.
* Prevent directory traversal.
* Restrict access to private files.
* Avoid exposing sensitive filesystem paths.

---

# 27. API Naming Convention

Use plural resource names.

Correct:

```text
/api/tasks
/api/projects
/api/users
/api/developers
/api/notifications
```

Avoid inconsistent naming such as:

```text
/api/getTasks
/api/createProject
/api/deleteUser
```

HTTP methods should communicate the operation.

```text
GET     → Retrieve
POST    → Create
PUT     → Full update
PATCH   → Partial update
DELETE  → Delete/archive
```

---

# 28. Route Organization

Backend routes should be separated into individual route files.

Recommended:

```text
server/routes/
├── authRoutes.js
├── userRoutes.js
├── taskRoutes.js
├── projectRoutes.js
├── developerRoutes.js
├── reviewRoutes.js
├── notificationRoutes.js
├── activityRoutes.js
├── reportRoutes.js
└── fileRoutes.js
```

Do not place the entire API inside `server.js`.

---

# 29. Controller Organization

Recommended:

```text
server/controllers/
├── authController.js
├── userController.js
├── taskController.js
├── projectController.js
├── developerController.js
├── reviewController.js
├── notificationController.js
├── activityController.js
├── reportController.js
└── fileController.js
```

Controllers should:

1. Receive request.
2. Validate/prepare input.
3. Call required service/business logic.
4. Return response.

Controllers should not become giant files containing every business rule.

---

# 30. Service Organization

Recommended:

```text
server/services/
├── authService.js
├── taskService.js
├── projectService.js
├── notificationService.js
├── activityService.js
└── fileService.js
```

Services contain reusable business logic.

Example:

```text
Task Controller
      ↓
Task Service
      ↓
MySQL
```

---

# 31. Database Access

All database operations must use the configured MySQL connection.

Database credentials must come from environment variables.

Do not hardcode:

```text
username
password
database name
production credentials
```

inside source code.

---

# 32. Logging

Important backend events should be logged appropriately.

Examples:

```text
Server startup
Database connection
Authentication failures
Unexpected errors
File upload failures
Critical operations
```

Do not log:

* Passwords
* Authentication secrets
* Session secrets
* Database passwords
* Sensitive user data unnecessarily

---

# 33. Development API Testing

During development, backend routes should be tested independently before connecting complex frontend flows.

Testing should verify:

* Authentication
* Authorization
* CRUD operations
* Validation
* Error handling
* File uploads
* File access
* Task workflow
* Review workflow
* Notifications
* Activity logging

---

# 34. API Architecture Rule

The API is an **internal application interface**.

It is not a public developer API.

Do not spend development effort creating:

* Public API keys
* Public API documentation portals
* API versioning systems
* Webhooks
* OAuth provider integrations
* Third-party API SDKs

unless a future PCT requirement explicitly demands them.

---

# 35. Final API Architecture

```text id="1f6gzo"
React Frontend
      │
      │
      ▼
/api
      │
      ├── /auth
      ├── /users
      ├── /developers
      ├── /projects
      ├── /tasks
      ├── /reviews
      ├── /workspace
      ├── /notifications
      ├── /activity
      ├── /files
      ├── /reports
      ├── /dashboard
      └── /settings
      │
      ▼
Express.js
      │
      ├── Middleware
      ├── Controllers
      └── Services
      │
      ▼
MySQL
      +
Hostinger File Storage
```

---

# 36. Source of Truth

This document defines the current PCT backend API architecture.

Claude and other developers must read this document before implementing or modifying API-related functionality.

If an implementation requirement conflicts with this document, the architecture should not be changed silently.

The conflict must be identified and the architecture decision must be updated before introducing a new pattern.

**PCT API principle: Keep it simple, secure, consistent, and internal.**
