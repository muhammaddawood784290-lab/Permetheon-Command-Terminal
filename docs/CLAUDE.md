# PCT — Claude Development Instructions

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Production Domain:** `pct.permetheon.com`
**Purpose:** Internal Developer & Project Management CRM
**Status:** Active

---

# 1. Project Overview

PCT (Permetheon Command Terminal) is an internal CRM and developer operations platform for Permetheon.

The purpose of PCT is to replace manual developer task sheets with a centralized working system.

PCT manages:

* Developers
* Users
* Roles
* Projects
* Tasks
* Assignments
* Reviews
* Comments
* Files
* Notifications
* Activity logs
* Reports
* Internal operations

PCT is an internal business application.

It is NOT a public SaaS product.

---

# 2. Primary Development Rule

Before modifying or creating code, understand the existing project structure.

**Do not redesign the architecture unless explicitly instructed.**

Do not introduce a new framework, database, service, or major dependency simply because it is personally preferred.

The current architecture is intentional.

---

# 3. Official Technology Stack

## Frontend

```text
React 18+
JavaScript
HTML
Tailwind CSS
```

## Backend

```text
Node.js
Express.js
JavaScript
```

## Database

```text
MySQL
```

## File Storage

```text
Hostinger Server Filesystem
```

---

# 4. Technologies NOT To Introduce

Do not introduce the following unless explicitly requested:

```text
TypeScript
Next.js
Vue
Angular
Laravel
PHP backend
Prisma
MongoDB
PostgreSQL
Firebase
Supabase
Auth0
Clerk
GraphQL
Redis
Docker
Kubernetes
Microservices
External AI APIs
External CRM APIs
Cloud file storage
```

The project intentionally uses a simple React + Express + MySQL architecture.

---

# 5. Architecture

The official architecture is:

```text
React 18+
     ↓
Express.js
     ↓
MySQL
```

File architecture:

```text
React
   ↓
Express
   ↓
Hostinger Filesystem
```

MySQL stores file metadata.

The physical files remain on the Hostinger server.

---

# 6. Frontend Rules

Frontend code lives inside the client application.

Recommended structure:

```text
client/
└── src/
    ├── assets/
    ├── components/
    ├── pages/
    ├── context/
    ├── hooks/
    ├── routes/
    ├── services/
    ├── utils/
    ├── App.jsx
    ├── main.jsx
    └── index.css
```

Follow the existing structure if it already differs slightly.

Do not restructure the entire frontend unnecessarily.

---

# 7. Backend Rules

Backend code should follow a layered Express architecture.

Recommended:

```text
server/
├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
├── utils/
├── uploads/
├── app.js
└── server.js
```

Expected request flow:

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
MySQL / Filesystem
```

---

# 8. Controller Rules

Controllers should remain relatively thin.

Controllers should:

* Read request data
* Validate or delegate validation
* Call services
* Return responses
* Handle expected errors

Do NOT put huge business-logic blocks inside route files.

Bad:

```text
Route
 └── 200 lines of database + business logic
```

Preferred:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Database
```

---

# 9. Service Rules

Business logic belongs inside services.

Examples:

```text
taskService.js
projectService.js
authService.js
userService.js
fileService.js
notificationService.js
activityService.js
```

Services should contain reusable business operations.

Do not duplicate the same business rules across multiple controllers.

---

# 10. Database Rules

MySQL is the primary source of truth for application data.

The frontend must NEVER connect directly to MySQL.

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

Database credentials must only exist in environment variables.

---

# 11. File Storage Rules

PCT has approximately 50 GB of Hostinger server storage.

Uploaded files must be stored on the Hostinger filesystem.

MySQL stores metadata.

Example:

```text
Hostinger
└── uploads/
    ├── tasks/
    ├── projects/
    ├── profiles/
    └── general/
```

Database stores:

```text
file_id
original_name
stored_name
path
mime_type
size
uploaded_by
related_entity
created_at
```

Do not store large files directly inside MySQL unless explicitly required.

---

# 12. Authentication

Authentication is application-managed.

Do not use external authentication providers.

Authentication is handled by:

```text
Express
+
MySQL
+
Secure Authentication State
```

Initial roles:

```text
ADMIN
TEAM_LEAD
DEVELOPER
```

Public registration is disabled.

Users are created internally by authorized administrators.

Read `AUTHENTICATION.md` before modifying authentication.

---

# 13. Authorization

Never trust frontend role information.

Backend authorization is mandatory.

Example:

```text
Developer
   ↓
DELETE /api/users/10
   ↓
Backend Permission Check
   ↓
403 Forbidden
```

Hiding a button in React is not a security mechanism.

---

# 14. API Rules

All application APIs use:

```text
/api
```

Examples:

```text
/api/auth
/api/users
/api/projects
/api/tasks
/api/reviews
/api/files
/api/activity
```

API behavior must remain consistent with `API.md`.

Do not invent completely different endpoint conventions without a documented reason.

---

# 15. API Response Format

Prefer consistent JSON responses.

Success example:

```json
{
  "success": true,
  "data": {}
}
```

Error example:

```json
{
  "success": false,
  "message": "Something went wrong."
}
```

Do not randomly change response structures between endpoints.

---

# 16. Authentication API

Core endpoints:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Future functionality may include:

```text
POST /api/auth/change-password
```

Authentication implementation must follow `AUTHENTICATION.md`.

---

# 17. Activity Logging

Important backend actions must create activity records.

Examples:

```text
TASK_CREATED
TASK_ASSIGNED
TASK_STATUS_CHANGED
TASK_COMPLETED
TASK_APPROVED
TASK_REVISION_REQUESTED
PROJECT_CREATED
USER_CREATED
FILE_UPLOADED
```

Activity logging must be backend-controlled.

Frontend must never directly insert activity records.

Read `ACTIVITY_LOG.md` before implementing activity-related functionality.

---

# 18. Activity vs Server Logs

Do not confuse:

```text
Activity Logs
```

with:

```text
Server Logs
```

Activity logs describe user/business actions.

Example:

```text
Ahmed changed Task #102 to REVIEW.
```

Server logs describe technical events.

Example:

```text
Database connection failed.
```

They are separate systems.

---

# 19. Task Architecture

Tasks are a central part of PCT.

Expected lifecycle:

```text
BACKLOG
   ↓
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

Do not create arbitrary task statuses without checking the existing architecture.

---

# 20. Project Architecture

Projects contain:

```text
Project
├── Members
├── Tasks
├── Files
├── Activity
└── Progress
```

Historical project information should generally be preserved.

Prefer archiving over destructive deletion where historical records matter.

---

# 21. Review Architecture

Review workflow:

```text
Developer
    ↓
Submit Task
    ↓
REVIEW
    ├── APPROVED
    │      ↓
    │  COMPLETED
    │
    └── REVISION_REQUIRED
           ↓
       IN_PROGRESS
```

Reviews must preserve:

* Reviewer
* Task
* Feedback
* Timestamp
* Result

---

# 22. Notifications

Notifications are separate from activity logs.

Activity answers:

> What happened?

Notification answers:

> What do I need to know?

Example:

```text
Activity:
Ahmed submitted Task #104 for review.

Notification:
Task #104 is ready for your review.
```

Do not merge these systems.

---

# 23. Frontend State

Use React state and Context where appropriate.

Global state should remain limited.

Do not introduce Redux, Zustand, Jotai, or another state-management library unless explicitly requested.

Prefer:

```text
React State
+
Context
+
Custom Hooks
```

for the current application scope.

---

# 24. Styling Rules

Use:

```text
Tailwind CSS
```

as the primary styling system.

Avoid introducing another CSS framework.

Do not mix multiple styling systems unnecessarily.

Reusable UI components should be created when the same pattern appears repeatedly.

---

# 25. UI Component Rules

Prefer reusable components:

```text
Button
Modal
Input
Select
Table
Badge
Card
Dropdown
Toast
LoadingState
EmptyState
```

Do not duplicate the same component markup across multiple pages when a reusable component makes sense.

---

# 26. Responsive Design

PCT should work on:

* Desktop
* Laptop
* Tablet
* Smaller screens where practical

The primary target is internal desktop/laptop usage.

Do not sacrifice desktop usability merely to optimize for mobile.

---

# 27. Error Handling

Backend errors must use centralized error handling.

Expected flow:

```text
Request
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

Do not expose:

```text
Database credentials
Stack traces
Passwords
Tokens
Internal secrets
```

to normal users in production.

---

# 28. Validation

Validate input on both sides.

Frontend validation:

```text
UX
```

Backend validation:

```text
Security + Data Integrity
```

Never assume frontend validation is sufficient.

---

# 29. Security Rules

Never:

* Store plain-text passwords
* Expose password hashes
* Hardcode credentials
* Commit `.env`
* Trust frontend permissions
* Allow unrestricted production CORS
* Build SQL queries from unsafe raw input
* Log passwords
* Log authentication tokens
* Accept arbitrary filesystem paths
* Allow path traversal
* Expose internal server errors to users

---

# 30. Environment Variables

Production secrets must be stored in `.env`.

Example:

```env
NODE_ENV=production
PORT=5000

DB_HOST=
DB_PORT=3306
DB_NAME=
DB_USER=
DB_PASSWORD=

SESSION_SECRET=
```

Never commit real credentials.

If `.env.example` exists, use placeholders only.

---

# 31. Dependency Rules

Before adding a dependency ask:

1. Is it actually required?
2. Can the existing stack solve the problem?
3. Does it add unnecessary complexity?
4. Is it compatible with Hostinger?
5. Does it introduce security or maintenance concerns?

Do not install packages just because they are popular.

---

# 32. No Unnecessary Refactoring

When implementing a feature:

**Do not rewrite unrelated code.**

If the task is:

```text
Add task filtering
```

do not simultaneously:

* Rewrite authentication
* Replace routing
* Change database architecture
* Rebuild the dashboard
* Rename unrelated files

Keep changes scoped.

---

# 33. Existing Code First

Before creating a new:

```text
component
service
utility
route
middleware
database function
```

check whether an equivalent already exists.

Reuse existing functionality whenever appropriate.

Avoid duplicate implementations.

---

# 34. File Naming

Use consistent naming.

React components:

```text
PascalCase.jsx
```

Example:

```text
TaskCard.jsx
ProjectTable.jsx
Login.jsx
```

Services:

```text
camelCase.js
```

Example:

```text
taskService.js
authService.js
```

Backend routes:

```text
camelCase.js
```

Example:

```text
taskRoutes.js
authRoutes.js
```

---

# 35. Documentation

Important documentation exists in the project.

Claude must consult relevant documentation before making architectural changes.

Core documents:

```text
ARCHITECTURE.md
ARCHITECTURE_LOG.md
API.md
AUTHENTICATION.md
ACTIVITY_LOG.md
DATABASE.md
CLAUDE.md
```

If another project documentation file exists, read it when relevant.

---

# 36. Documentation Hierarchy

Use the documents for different purposes.

```text
CLAUDE.md
    ↓
Development rules and AI instructions

ARCHITECTURE.md
    ↓
Current system architecture

ARCHITECTURE_LOG.md
    ↓
Architecture decisions/history

DATABASE.md
    ↓
Database structure

API.md
    ↓
API contracts

AUTHENTICATION.md
    ↓
Authentication system

ACTIVITY_LOG.md
    ↓
Audit/activity system
```

Do not treat `ARCHITECTURE_LOG.md` as the current architecture.

`ARCHITECTURE.md` represents the current approved architecture.

---

# 37. Change Management

If a requested change affects architecture:

1. Identify the affected architecture.
2. Check existing documentation.
3. Explain the conflict internally through the implementation plan.
4. Do not silently change the architecture.
5. Update the relevant documentation if the change is approved.

---

# 38. Database Changes

When changing the database:

1. Review `DATABASE.md`.
2. Check existing tables.
3. Check relationships.
4. Check indexes.
5. Avoid duplicate columns/tables.
6. Preserve existing data.
7. Update `DATABASE.md` when the schema changes.

Do not invent a parallel database structure.

---

# 39. API Changes

When creating or modifying an endpoint:

1. Check `API.md`.
2. Follow existing naming conventions.
3. Follow existing response format.
4. Apply authentication where required.
5. Apply authorization where required.
6. Validate input.
7. Update `API.md`.

---

# 40. Authentication Changes

Before modifying authentication:

Read:

```text
AUTHENTICATION.md
```

Authentication changes must preserve:

* Secure password handling
* Session security
* Authorization
* Protected backend routes
* Activity logging

Never replace the authentication architecture with an external provider unless explicitly instructed.

---

# 41. Activity Changes

Before modifying activity functionality:

Read:

```text
ACTIVITY_LOG.md
```

Important business actions should remain auditable.

Do not create meaningless activity events for every frontend interaction.

---

# 42. File Upload Rules

Uploaded files must:

* Have safe filenames
* Be stored inside approved upload directories
* Have validated file types
* Have reasonable size limits
* Never accept arbitrary filesystem paths
* Be associated with the correct application entity

Never allow user-controlled paths to directly determine filesystem locations.

---

# 43. Production Environment

Production domain:

```text
pct.permetheon.com
```

The application is intended to run on Hostinger.

Deployment must not require Docker.

Do not introduce infrastructure requirements that Hostinger cannot reasonably support.

---

# 44. No External API Dependency

PCT does not currently require external APIs.

Do not add:

```text
AI API
External CRM API
External task API
External authentication API
External file API
```

unless explicitly requested.

The application should operate using:

```text
React
Express
MySQL
Hostinger Storage
```

---

# 45. Development Workflow

Before starting a significant task:

```text
1. Read relevant documentation.
2. Inspect existing implementation.
3. Identify affected files.
4. Understand existing data flow.
5. Implement the smallest correct change.
6. Verify affected functionality.
7. Check for regressions.
8. Update documentation if required.
```

---

# 46. Do Not Guess

If existing code or documentation already defines something:

**Use the existing definition.**

Do not guess:

* Database columns
* API responses
* Roles
* Task statuses
* File paths
* Authentication behavior
* Permission rules

If something is genuinely undefined, choose the simplest implementation consistent with the architecture and document the decision when appropriate.

---

# 47. Testing Expectations

After meaningful implementation work, verify:

### Frontend

```text
Page loads
Navigation works
Forms work
Validation works
Loading states work
Error states work
Responsive behavior works
```

### Backend

```text
Route works
Authentication works
Authorization works
Validation works
Database operation works
Error handling works
```

### Integration

```text
React
 ↓
Express
 ↓
MySQL
```

must work correctly.

---

# 48. Build & Production Verification

Before considering a major feature complete:

```text
1. Run frontend build.
2. Check backend startup.
3. Check database connection.
4. Check relevant API endpoints.
5. Check authentication.
6. Check affected pages.
7. Check browser console.
8. Check server errors.
```

Do not declare a feature complete merely because the code was written.

---

# 49. Avoid Overengineering

PCT is an internal CRM.

Prefer:

```text
Simple
Clear
Reliable
Maintainable
```

over:

```text
Complex
Abstract
Over-engineered
Dependency-heavy
```

A straightforward solution is preferred when it satisfies the requirement.

---

# 50. Claude Implementation Behavior

When Claude receives an implementation task, Claude should:

### Step 1 — Understand

Read the relevant documentation and inspect the existing code.

### Step 2 — Plan

Identify:

* Files to modify
* Files to create
* Database changes
* API changes
* UI changes
* Security implications

### Step 3 — Implement

Make focused changes.

### Step 4 — Verify

Test the affected functionality.

### Step 5 — Report

Clearly state:

* What changed
* Which files changed
* What was tested
* Any remaining issue
* Any documentation that needs updating

---

# 51. Claude Must Not

Claude must NOT:

* Rewrite the entire project unnecessarily.
* Change the stack without approval.
* Add random dependencies.
* Replace MySQL.
* Replace Express.
* Introduce TypeScript.
* Introduce an external authentication provider.
* Introduce Docker.
* Create microservices.
* Store files in external cloud storage.
* Put MySQL credentials in frontend code.
* Create duplicate components unnecessarily.
* Bypass backend authorization.
* Remove existing functionality without reason.
* Claim something was tested when it was not.
* Claim deployment succeeded without verifying it.

---

# 52. Completion Standard

A task is not complete simply because implementation exists.

A task is considered complete when:

```text
Implementation
      +
Integration
      +
Validation
      +
Error Handling
      +
Security
      +
Verification
```

are appropriately addressed.

---

# 53. Priority Order

When requirements conflict, prioritize:

```text
1. Security
2. Data Integrity
3. Existing Architecture
4. Correct Functionality
5. Maintainability
6. Performance
7. UI Polish
```

Do not sacrifice security or data integrity for convenience.

---

# 54. Final Architecture Reference

```text
                    PCT
         Permetheon Command Terminal
                    │
                    ▼
          ┌──────────────────┐
          │ React 18+        │
          │ JavaScript       │
          │ HTML             │
          │ Tailwind CSS     │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Express.js       │
          │ Node.js          │
          │                  │
          │ Routes           │
          │ Middleware       │
          │ Controllers      │
          │ Services         │
          └────────┬─────────┘
                   │
            ┌──────┴──────┐
            ▼             ▼
      ┌──────────┐   ┌──────────────┐
      │  MySQL   │   │  Hostinger   │
      │          │   │  Filesystem  │
      │ App Data │   │ Uploaded     │
      │ Metadata │   │ Files        │
      └──────────┘   └──────────────┘
```

---

# 55. Final Instruction

**Treat this file as the primary AI development instruction document for PCT.**

Before implementing a task, Claude must inspect the existing code and relevant documentation.

The goal is not to produce the most complicated system.

The goal is to produce a **clean, reliable, secure, maintainable internal CRM for Permetheon developers and project operations.**

> **Build what is required. Reuse what already exists. Do not invent unnecessary complexity. Verify before declaring completion.**
