# PCT — System Architecture

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Architecture Version:** 1.0
**Status:** Active

---

# 1. System Overview

PCT (Permetheon Command Terminal) is an internal web application built for Permetheon's development and project operations.

The system replaces manual developer task sheets with a centralized platform for:

* Developer management
* Project management
* Task management
* Task assignment
* Task tracking
* Task reviews
* Team collaboration
* Notifications
* Activity tracking
* File management
* Reports
* Internal operations

PCT is designed as a **single centralized application**.

The architecture intentionally avoids unnecessary complexity.

---

# 2. Architecture Goals

The architecture must prioritize:

1. Simplicity
2. Maintainability
3. Security
4. Clear separation of responsibilities
5. Fast development
6. Reliable data management
7. Easy Hostinger deployment
8. Future extensibility without premature overengineering

The application must be understandable and maintainable by Permetheon's development team.

---

# 3. Technology Stack

## Frontend

```text
React 18+
JavaScript
HTML
Tailwind CSS
```

React handles:

* User interface
* Navigation
* Forms
* Interactive components
* Client-side state
* API communication
* User feedback

---

## Backend

```text
Node.js
Express.js
JavaScript
```

Express handles:

* Authentication
* Authorization
* Request handling
* Business logic
* Database communication
* File handling
* Notifications
* Activity logging

---

## Database

```text
MySQL
```

MySQL is the primary persistent data layer.

---

## File Storage

```text
Hostinger Server Storage
```

PCT has approximately 50 GB of available server disk space.

Actual uploaded files are stored on the Hostinger filesystem.

MySQL stores file metadata and references.

---

# 4. High-Level Architecture

```text
                         PCT
                          │
                          ▼
              ┌──────────────────────┐
              │    React Frontend    │
              │                      │
              │ React 18+            │
              │ JavaScript           │
              │ HTML                 │
              │ Tailwind CSS         │
              └──────────┬───────────┘
                         │
                         │ Internal HTTP
                         ▼
              ┌──────────────────────┐
              │    Express Server    │
              │                      │
              │ Routes               │
              │ Middleware           │
              │ Controllers          │
              │ Services             │
              └──────────┬───────────┘
                         │
                ┌────────┴────────┐
                ▼                 ▼
       ┌────────────────┐  ┌──────────────────┐
       │     MySQL      │  │ Hostinger Storage│
       │                │  │                  │
       │ Application    │  │ Actual uploaded  │
       │ data           │  │ files            │
       └────────────────┘  └──────────────────┘
```

---

# 5. Application Layers

PCT is divided into four primary layers.

```text
Presentation Layer
        ↓
API Layer
        ↓
Business Logic Layer
        ↓
Data / Storage Layer
```

---

# 6. Presentation Layer

The presentation layer is the React application.

Responsibilities:

* Render pages
* Render components
* Collect user input
* Display data
* Handle navigation
* Display validation errors
* Display success/error messages
* Communicate with Express backend

The frontend must not directly connect to MySQL.

```text
React
  ↓
Express
  ↓
MySQL
```

Never:

```text
React
  ↓
MySQL
```

---

# 7. API Layer

Express provides the internal application API.

Responsibilities:

* Receive HTTP requests
* Authenticate users
* Authorize operations
* Validate requests
* Route requests
* Return JSON responses
* Handle file uploads
* Handle errors

Recommended API prefix:

```text
/api
```

Example:

```text
/api/auth
/api/users
/api/projects
/api/tasks
/api/reviews
/api/files
```

---

# 8. Business Logic Layer

Business logic must remain separate from frontend UI code and raw route definitions.

Examples:

### Task Logic

```text
Create Task
Assign Task
Change Status
Submit Review
Approve Task
Request Revision
Complete Task
```

### Project Logic

```text
Create Project
Add Member
Remove Member
Assign Tasks
Update Status
Archive Project
```

### User Logic

```text
Create User
Assign Role
Deactivate User
Update User
```

Business rules should be implemented on the backend.

---

# 9. Data Layer

MySQL is the primary application database.

The data layer handles:

* Users
* Roles
* Projects
* Tasks
* Comments
* Reviews
* Notifications
* Activity logs
* File metadata
* Reports

Database credentials must only exist in environment configuration.

---

# 10. File Storage Layer

PCT separates database data from physical file storage.

```text
                 File Upload
                     │
                     ▼
                Express
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
 Hostinger Filesystem        MySQL
          │                     │
          │                     └── Metadata
          │
          └── Actual File
```

Example:

```text
server/uploads/
├── tasks/
├── projects/
├── profiles/
└── general/
```

MySQL should store:

```text
File ID
Original Name
Stored Name
Path
MIME Type
Size
Uploader
Related Entity
Created At
```

Large binary files should not be stored directly inside MySQL.

---

# 11. Frontend Structure

The React frontend follows a feature-oriented structure.

```text
client/src/
│
├── assets/
├── components/
├── pages/
├── context/
├── hooks/
├── services/
├── utils/
├── routes/
│
├── App.jsx
├── main.jsx
└── index.css
```

---

# 12. Components

Components are reusable UI building blocks.

Examples:

```text
Button
Modal
Input
Select
Table
Badge
Avatar
Toast
Spinner
```

Feature-specific components should remain grouped together.

Example:

```text
components/tasks/
components/projects/
components/developers/
components/reviews/
```

Do not create one giant component containing the entire application.

---

# 13. Pages

Pages represent complete application views.

Example:

```text
pages/
├── auth/
├── Dashboard.jsx
├── MyWorkspace.jsx
├── tasks/
├── projects/
├── developers/
├── reviews/
├── notifications/
├── activity/
├── reports/
└── settings/
```

Pages compose reusable components rather than duplicating UI logic.

---

# 14. Services

Frontend services handle communication with the backend.

Example:

```text
services/
├── authService.js
├── taskService.js
├── projectService.js
├── developerService.js
├── reviewService.js
├── notificationService.js
└── fileService.js
```

Components should not contain large amounts of repeated HTTP request code.

Instead:

```text
Component
   ↓
Service
   ↓
Express API
```

---

# 15. Context

React Context should only be used for genuinely global application state.

Initial contexts:

```text
AuthContext
NotificationContext
```

Do not put every piece of application state into Context.

---

# 16. Backend Structure

The Express backend follows a layered structure.

```text
server/
│
├── config/
├── controllers/
├── routes/
├── middleware/
├── services/
├── utils/
├── uploads/
│
├── app.js
└── server.js
```

---

# 17. Server Entry Points

## server.js

Responsible for:

* Starting the server
* Loading environment configuration
* Starting Express
* Database startup checks where required

## app.js

Responsible for:

* Express initialization
* Middleware
* Routes
* Error handling

This separation keeps application configuration separate from server startup.

---

# 18. Route Layer

Routes define the API endpoints.

Example:

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

Routes should not contain large business logic blocks.

---

# 19. Middleware Layer

Middleware handles shared request processing.

Initial middleware:

```text
authMiddleware.js
roleMiddleware.js
uploadMiddleware.js
errorMiddleware.js
notFoundMiddleware.js
```

Responsibilities include:

* Authentication
* Role checking
* File handling
* Error handling
* Invalid route handling

---

# 20. Controller Layer

Controllers connect HTTP requests to business operations.

Example:

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
Database
```

Controllers should:

* Read request data
* Call business logic
* Return response
* Handle expected errors

Controllers should not become large monolithic files.

---

# 21. Service Layer

Services contain reusable business rules.

Example:

```text
taskService.js
projectService.js
authService.js
fileService.js
notificationService.js
activityService.js
```

Example task flow:

```text
taskController
      ↓
taskService
      ↓
MySQL
```

---

# 22. Authentication Architecture

PCT is an internal system.

Public registration is disabled.

Users are created by authorized administrators.

Authentication flow:

```text
User
 │
 ▼
Login Page
 │
 ▼
POST /api/auth/login
 │
 ▼
Express Authentication
 │
 ▼
Validate Credentials
 │
 ▼
Create Secure Auth State
 │
 ▼
Authenticated Application
```

Protected routes require authentication.

---

# 23. Authorization Architecture

Initial roles:

```text
ADMIN
TEAM_LEAD
DEVELOPER
```

Permissions must be checked server-side.

Example:

```text
Developer
   ↓
DELETE /api/users/10
   ↓
Role Check
   ↓
403 Forbidden
```

Frontend UI restrictions are only for user experience.

They are not a security boundary.

---

# 24. Task Architecture

Tasks are the central operational entity.

```text
Project
   │
   ├── Task
   │     ├── Assignee
   │     ├── Comments
   │     ├── Attachments
   │     ├── Reviews
   │     └── Activity
   │
   └── Task
```

Task lifecycle (aligned with `TASK_SYSTEM.md §3` and
`DATABASE.md §19`):

```text
BACKLOG
   ↓
TODO
   ↓
IN_PROGRESS
   ↓
IN_REVIEW
   ↓
COMPLETED
```

Revision:

```text
IN_REVIEW
   ↓
REVISION_REQUIRED
   ↓
IN_PROGRESS
   ↓
IN_REVIEW
```

The legacy `ASSIGNED` step is not used in V1 — `TODO` is the explicit
"ready to start" marker after a developer has been assigned. The legacy
`REVIEW` task status is replaced by `IN_REVIEW` to keep the on-task
marker in lockstep with the review record's `IN_REVIEW` state.

Side states: `BLOCKED` (cannot move forward) and `CANCELLED` (abandoned).

Every meaningful task state change should be logged.

---

# 25. Project Architecture

Projects provide the organizational context for development work.

```text
Project
│
├── Project Members
├── Tasks
├── Files
├── Activity
└── Progress
```

Project deletion should generally be replaced by archiving when historical records must be retained.

---

# 26. Review Architecture

The review system provides accountability for completed development work.

```text
Developer
    │
    ▼
Submit Task
    │
    ▼
IN_REVIEW  (task status)
    │
    ├──────────────┐
    ▼              ▼
 APPROVED       REVISION_REQUIRED
    │              │
    ▼              ▼
COMPLETED      IN_PROGRESS
```

Review record status vocabulary (see `REVIEW_SYSTEM.md §5`):

```text
SUBMITTED → IN_REVIEW
            ├── APPROVED
            └── REVISION_REQUIRED → RESUBMITTED → IN_REVIEW
```

Reviews must retain feedback and reviewer information.

---

# 27. Notification Architecture

Notifications are stored internally.

Notification triggers include:

* Task assignment
* Task review submission
* Task approval
* Revision request
* Deadline reminders
* Overdue tasks
* New comments
* Project assignment

Notifications belong to individual users.

---

# 28. Activity Architecture

Activity logging provides an operational audit trail.

Example:

```text
Developer A
   ↓
Changed Task #102
   ↓
IN_PROGRESS → REVIEW
   ↓
Timestamp
```

Activity records should not normally be editable by standard users.

---

# 29. Dashboard Architecture

The dashboard should be role-aware.

### Admin Dashboard

Shows:

* Total projects
* Active projects
* Total developers
* Active tasks
* Completed tasks
* Overdue tasks
* Pending reviews
* Recent activity

### Team Lead Dashboard

Shows:

* Assigned projects
* Team workload
* Active tasks
* Pending reviews
* Overdue work
* Recent activity

### Developer Dashboard

Shows:

* My active tasks
* Today's tasks
* Upcoming deadlines
* Overdue tasks
* Pending reviews
* Recent activity

---

# 30. My Workspace

`My Workspace` is the developer's personal operational view.

It should prioritize:

```text
My Tasks
Today's Work
Upcoming Deadlines
Overdue Work
Tasks In Review
Recent Activity
```

The workspace must automatically use the authenticated user's identity.

A developer should not be able to modify the request to view another developer's private workspace.

---

# 31. Reports Architecture

Reports should be generated from MySQL data.

Initial reports:

```text
Task Overview
Developer Workload
Project Progress
Completion Rate
Overdue Work
Review Statistics
```

Reports should use database queries rather than duplicating operational data into a second reporting database.

---

# 32. Error Architecture

All unexpected backend errors should pass through centralized error handling.

```text
Request
   ↓
Route
   ↓
Controller
   ↓
Service
   ↓
Error
   ↓
Error Middleware
   ↓
JSON Response
```

Frontend should show understandable messages.

Internal stack traces must not be shown to normal users in production.

---

# 33. Security Architecture

Security must exist at every relevant layer.

### Frontend

* Protected routes
* Session awareness
* Role-aware UI
* Input validation feedback

### Backend

* Authentication
* Authorization
* Request validation
* Secure file handling
* SQL injection prevention
* Error handling

### Database

* Strong credentials
* Restricted access
* Foreign keys
* Data integrity

### Storage

* Safe filenames
* Restricted file types
* Protected file access
* Path traversal prevention

---

# 34. Environment Architecture

Environment-specific configuration belongs in `.env`.

Example:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=pct
DB_USER=
DB_PASSWORD=

SESSION_SECRET=
```

Production secrets must never be committed to Git.

---

# 35. Deployment Architecture

Production:

```text
https://pct.permetheon.com
```

Hostinger provides:

```text
React Frontend
      +
Node.js / Express
      +
MySQL
      +
50 GB File Storage
```

PCT must be deployable without Docker.

---

# 36. Dependency Philosophy

PCT intentionally uses a minimal dependency strategy.

Do not introduce libraries unless there is a clear requirement.

The following are NOT part of the current architecture:

```text
Prisma
Redis
Docker
Kubernetes
GraphQL
Firebase
Supabase
Microservices
External cloud storage
External AI APIs
External CRM APIs
```

If a future requirement needs one of these technologies, the architectural decision must be documented before implementation.

---

# 37. No Microservices

PCT is a single application.

```text
React
   +
Express
   +
MySQL
   +
Hostinger Storage
```

Do not split PCT into multiple backend services.

This keeps deployment and maintenance simple.

---

# 38. No Direct Database Access From Frontend

The React frontend must never contain MySQL credentials or connect directly to MySQL.

Correct:

```text
React
  ↓
Express
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

# 39. Data Ownership

MySQL is the source of truth for application records.

The filesystem is the source of truth for actual uploaded files.

The two are linked through file metadata.

```text
MySQL
  └── File metadata
        │
        └── file_path
                │
                ▼
       Hostinger filesystem
```

---

# 40. Scalability Strategy

PCT should scale through clean code and proper database design rather than premature infrastructure.

Future expansion may include:

* More users
* More projects
* More tasks
* More file storage
* More reporting
* Additional internal modules

The architecture should allow these additions without requiring a complete rewrite.

However, infrastructure should only become more complex when actual usage requires it.

---

# 41. Development Rules

Developers working on PCT must:

1. Follow the existing folder structure.
2. Reuse existing components.
3. Avoid duplicate functionality.
4. Keep backend business logic server-side.
5. Validate user input.
6. Protect sensitive routes.
7. Keep database operations organized.
8. Keep files organized by purpose.
9. Avoid unnecessary dependencies.
10. Document meaningful architectural changes.

---

# 42. Source of Truth

This document defines the **current system architecture** of PCT.

`ARCHITECTURE_LOG.md` documents architectural decisions and their history.

`ARCHITECTURE.md` defines the architecture that the current implementation should follow.

If implementation requirements conflict with this document:

1. Stop and identify the conflict.
2. Do not silently introduce a different architecture.
3. Determine whether the requirement is actually necessary.
4. Update the architecture documentation if a change is approved.

---

# 43. Final Architecture

```text
                    PCT
          Permetheon Command Terminal
                    │
                    ▼
        ┌─────────────────────┐
        │    React 18+        │
        │    JavaScript       │
        │    HTML             │
        │    Tailwind CSS     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │    Node.js          │
        │    Express.js       │
        │                     │
        │ Routes              │
        │ Middleware          │
        │ Controllers         │
        │ Services            │
        └──────────┬──────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
   ┌──────────────┐  ┌─────────────────┐
   │    MySQL     │  │ Hostinger       │
   │              │  │ File Storage    │
   │ App Data     │  │                 │
   │ Metadata     │  │ Actual Files    │
   └──────────────┘  └─────────────────┘
```

**PCT architectural principle:**

> **Simple enough to maintain. Structured enough to scale. Secure enough for internal operations.**

This architecture is the current implementation source of truth for Permetheon Command Terminal.
