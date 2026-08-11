# PCT — Permetheon Command Terminal

> Internal Developer Command & Work Management System for Permetheon.

**Production:** `pct.permetheon.com`

---

## 1. Project Overview

**PCT (Permetheon Command Terminal)** is an internal web-based platform built for Permetheon's development team.

It replaces traditional developer task sheets with a centralized working system where developers and management can:

* Manage projects
* Create and assign development tasks
* Track task progress
* Review completed work
* Request revisions
* Manage files
* Track developer activity
* Receive notifications
* View reports
* Manage permissions
* Monitor project progress

PCT is an **internal operational system**, not a public SaaS product.

---

# 2. Primary Goals

PCT exists to provide one central place for development operations.

The system should make it easy to answer:

```text
What are we working on?
Who is working on it?
What is pending?
What is currently being developed?
What needs review?
What is overdue?
What is blocked?
What has been completed?
Who changed what?
```

---

# 3. Core Principles

PCT follows these principles:

```text
Simple
Fast
Secure
Internal
Developer-Focused
Permission-Aware
Database-Driven
Auditable
Maintainable
Responsive
```

The application should prioritize functionality over unnecessary visual complexity.

---

# 4. Technology Stack

## Frontend

```text
React 18+
JavaScript
HTML5
Tailwind CSS
```

React is responsible for:

```text
UI
Routing
Component Rendering
Client-Side State
Forms
API Communication
User Interaction
```

---

## Backend

```text
Node.js
Express.js
JavaScript
```

Express is responsible for:

```text
REST API
Authentication
Authorization
Validation
Business Logic
Database Communication
File Operations
Notifications
Reports
```

---

## Database

```text
MySQL
```

MySQL is the primary persistent data store.

It stores:

```text
Users
Roles
Permissions
Projects
Tasks
Comments
Reviews
Notifications
Activity
Reports Data
File Metadata
```

---

## Styling

```text
Tailwind CSS
```

Tailwind should be the primary styling system.

---

# 5. No External API Dependency

PCT does **not** require external APIs for its core functionality.

The application should work using:

```text
React
   ↓
Express.js
   ↓
MySQL
   ↓
Hostinger Server
```

External third-party APIs should not be introduced unless explicitly required in the future.

---

# 6. Hosting

Production domain:

```text
pct.permetheon.com
```

The application is intended to run on Permetheon's Hostinger infrastructure.

The production environment contains:

```text
Frontend
Backend
MySQL
File Storage
```

---

# 7. File Storage

PCT has access to approximately **50 GB of server disk space**.

Application files uploaded through PCT should be stored on the Hostinger server.

MySQL stores the **file metadata and references**, not the raw binary file content.

Conceptually:

```text
User
 ↓
Upload File
 ↓
Express.js
 ↓
Hostinger Disk
 ↓
File Stored

MySQL
 ↓
File Metadata
 ├── ID
 ├── Name
 ├── Path
 ├── Size
 ├── MIME Type
 ├── Owner
 └── Related Task / Project
```

The exact implementation must follow:

```text
FILE_SYSTEM.md
DATABASE.md
SECURITY.md
```

---

# 8. Architecture

High-level architecture:

```text
                         USER
                           │
                           ▼
                    React Frontend
                           │
                    HTTP / REST API
                           │
                           ▼
                    Express Backend
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
        Business       Authentication   File System
         Logic          & Permissions
             │
             ▼
           MySQL
```

---

# 9. Application Layers

PCT should maintain clear separation between:

```text
Presentation
Business Logic
API
Database
File System
Authentication
Authorization
```

Do not place all application logic inside React components or Express route files.

---

# 10. Main Modules

PCT consists of the following major modules:

```text
Authentication
Dashboard
Projects
Tasks
Reviews
Notifications
Activity
Reports
Files
Settings
Users
Roles & Permissions
```

---

# 11. Authentication

Authentication controls user access to the application.

The system must support:

```text
Login
Logout
Session / Authentication State
Protected Routes
Account Validation
Authentication Errors
```

Detailed rules:

```text
AUTHENTICATION.md
```

---

# 12. Authorization

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
What are you allowed to do?
```

Every protected backend operation must verify permissions.

Detailed rules:

```text
ROLE_PERMISSIONS.md
SECURITY.md
```

---

# 13. Dashboard

The dashboard provides an operational overview.

Potential information:

```text
Active Tasks
Completed Tasks
Overdue Tasks
Tasks in Review
Blocked Tasks
Projects
Developer Workload
Recent Activity
```

Detailed behavior:

```text
DASHBOARD.md
```

---

# 14. Projects

Projects organize development work.

A project can contain:

```text
Project Information
Developers
Tasks
Files
Activity
Reports
```

Detailed behavior:

```text
PROJECT_SYSTEM.md
```

---

# 15. Tasks

Tasks are the primary unit of development work.

Task lifecycle:

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

Additional states:

```text
BLOCKED
REVISION_REQUIRED
CANCELLED
```

Detailed behavior:

```text
TASK_SYSTEM.md
```

---

# 16. Reviews

Tasks may require review before completion.

Workflow:

```text
Developer
   ↓
Submit Work
   ↓
IN_REVIEW
   ↓
Reviewer
   ├── Approve
   │      ↓
   │  COMPLETED
   │
   └── Request Revision
          ↓
     REVISION_REQUIRED
          ↓
      IN_PROGRESS
```

Detailed behavior:

```text
REVIEW_SYSTEM.md
```

---

# 17. Notifications

Notifications keep users informed about relevant events.

Examples:

```text
Task Assigned
Task Reassigned
Review Requested
Review Approved
Revision Requested
Deadline Approaching
Task Overdue
Mention
```

Detailed behavior:

```text
NOTIFICATION_SYSTEM.md
```

---

# 18. Activity Logging

Important system actions must be recorded.

Examples:

```text
Login
Task Created
Task Assigned
Task Updated
Status Changed
Review Submitted
Review Approved
Revision Requested
File Uploaded
Project Updated
Permission Changed
```

Detailed behavior:

```text
ACTIVITY_LOG.md
```

---

# 19. Reports

Reports provide operational insights.

Potential reports:

```text
Project Progress
Task Completion
Developer Workload
Overdue Tasks
Review Statistics
Activity Statistics
```

Detailed behavior:

```text
REPORTS.md
```

---

# 20. File System

Files can be associated with:

```text
Projects
Tasks
Reviews
```

Files are stored on the Hostinger server.

MySQL stores file metadata.

Detailed behavior:

```text
FILE_SYSTEM.md
```

---

# 21. Database

MySQL is the source of truth for application data.

Core entities include:

```text
users
roles
permissions
projects
tasks
task_comments
task_reviews
task_dependencies
notifications
activity_logs
files
```

Exact schema and relationships:

```text
DATABASE.md
```

---

# 22. API

Express.js provides the application's REST API.

Example structure:

```text
/api/auth
/api/users
/api/projects
/api/tasks
/api/reviews
/api/notifications
/api/activity
/api/reports
/api/files
```

Exact API contracts:

```text
API.md
```

---

# 23. Frontend

The React frontend communicates with Express through the internal REST API.

General flow:

```text
React Component
      ↓
API Request
      ↓
Express Route
      ↓
Validation
      ↓
Authorization
      ↓
Business Logic
      ↓
MySQL
      ↓
Response
      ↓
React UI
```

React must never connect directly to MySQL.

---

# 24. Backend

Express backend responsibilities:

```text
Routing
Authentication
Authorization
Validation
Business Logic
Database Operations
File Operations
Notifications
Activity Logging
Reports
Error Handling
```

Routes should remain thin where practical.

Business logic should not be unnecessarily duplicated across routes.

---

# 25. Database Access

All database communication must occur through the backend.

Never expose:

```text
MySQL Host
MySQL Username
MySQL Password
Database Credentials
```

to the React frontend.

---

# 26. Security

Security is a core requirement.

The system must protect against:

```text
SQL Injection
XSS
Unauthorized Access
IDOR
Broken Authorization
Session Abuse
Path Traversal
Unsafe File Uploads
Secret Exposure
```

Detailed requirements:

```text
SECURITY.md
AUTHENTICATION.md
ROLE_PERMISSIONS.md
```

---

# 27. UI/UX

PCT should feel like a professional internal developer command center.

The design should be:

```text
Clean
Modern
Technical
Fast
Information-Dense
Consistent
```

Avoid:

```text
Excessive Animation
Unnecessary Gradients
Overly Decorative UI
Huge Empty Spaces
Confusing Navigation
```

Detailed design rules:

```text
UI_UX.md
```

---

# 28. Testing

All important functionality must be tested.

Testing includes:

```text
Unit Testing
Integration Testing
API Testing
Database Testing
Authentication Testing
Authorization Testing
Security Testing
UI Testing
End-to-End Testing
Regression Testing
Deployment Testing
```

Detailed testing strategy:

```text
TESTING.md
```

---

# 29. Documentation System

The `/docs` directory or project documentation directory contains system specifications.

Core documentation includes:

```text
ARCHITECTURE_LOG.md
ARCHITECTURE.md
API.md
ACTIVITY_LOG.md
AUTHENTICATION.md
CLAUDE.md
CODING_STANDARD.md
DASHBOARD.md
DATABASE.md
DEVELOPER_SYSTEM.md
DEVELOPMENT.md
FILE_SYSTEM.md
NOTIFICATION_SYSTEM.md
PROJECT_OVERVIEW.md
PROJECT_SYSTEM.md
REPORTS.md
REVIEW_SYSTEM.md
ROLE_PERMISSIONS.md
ROUTE.md
SECURITY.md
TASK_SYSTEM.md
TESTING.md
UI_UX.md
```

These documents collectively define the intended behavior of PCT.

---

# 30. Documentation Priority

When implementing a feature, Claude/developers should use documentation in this order:

```text
1. README.md
2. ARCHITECTURE.md
3. PROJECT_OVERVIEW.md
4. Relevant Feature Documentation
5. DATABASE.md
6. API.md
7. SECURITY.md
8. ROLE_PERMISSIONS.md
9. CODING_STANDARD.md
10. TESTING.md
```

If two documents conflict:

```text
Stop
Identify the conflict
Do not silently choose
Update the documentation if required
Then continue
```

---

# 31. Claude Development Rules

Claude must read the relevant documentation before modifying the project.

Before implementing a feature:

```text
Understand Architecture
Understand Existing Code
Read Relevant Documentation
Inspect Database Structure
Inspect Existing Routes
Inspect Existing Components
Plan Changes
Implement
Test
Verify
```

Claude must not blindly rewrite existing systems.

---

# 32. No Unnecessary Rewrites

Do not rewrite an entire module when a focused change is sufficient.

Avoid:

```text
Replacing Working Components
Changing Stack Without Approval
Replacing Database Architecture
Introducing New Frameworks
Rebuilding Existing Features Without Need
```

---

# 33. Dependency Rules

Do not introduce new dependencies unless they are genuinely required.

Before adding a dependency:

```text
Check whether existing packages can solve the requirement.
```

If a new dependency is necessary:

```text
Document why it is required.
```

---

# 34. Code Quality

Code should be:

```text
Readable
Maintainable
Modular
Consistent
Documented Where Necessary
Secure
Testable
```

Detailed standards:

```text
CODING_STANDARD.md
```

---

# 35. Environment Variables

Sensitive configuration must be stored in environment variables.

Examples:

```text
DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD
AUTH_SECRET
```

Actual variable names should follow the implemented configuration.

Never commit secrets to Git.

---

# 36. Git Rules

Do not commit:

```text
.env
.env.local
Database Passwords
Private Keys
Production Secrets
Temporary Uploads
Build Artifacts Where Not Required
```

Use:

```text
.gitignore
```

appropriately.

---

# 37. Development Workflow

Recommended workflow:

```text
1. Pull Latest Code
2. Read Documentation
3. Inspect Relevant Module
4. Create/Update Feature
5. Run Development Server
6. Test Feature
7. Run Regression Checks
8. Review Changes
9. Commit
10. Deploy
11. Production Smoke Test
```

---

# 38. Frontend Development

React code should be organized logically.

Recommended conceptual structure:

```text
src/
├── components/
├── pages/
├── layouts/
├── hooks/
├── services/
├── utils/
├── context/
├── assets/
└── App.jsx
```

Actual project structure is authoritative over this conceptual example.

---

# 39. Backend Development

Recommended conceptual structure:

```text
server/
├── routes/
├── controllers/
├── services/
├── middleware/
├── models/
├── utils/
├── config/
└── server.js
```

The actual existing project structure must be respected.

---

# 40. API Communication

Frontend API calls should be centralized where practical.

Avoid scattering raw API request logic throughout dozens of components.

Preferred concept:

```text
React Component
      ↓
API Service
      ↓
Express API
```

---

# 41. Error Handling

Backend errors must return consistent responses.

Frontend must:

```text
Handle Errors
Show Useful Feedback
Avoid Crashes
Allow Retry Where Appropriate
```

Never silently ignore failed API requests.

---

# 42. Logging

Development logs may be verbose.

Production logs should be controlled.

Never log:

```text
Passwords
Authentication Secrets
Database Passwords
Private Tokens
Sensitive User Data
```

---

# 43. Performance

PCT should remain responsive as data grows.

Use:

```text
Pagination
Server-Side Filtering
Indexed Database Queries
Lazy Loading Where Appropriate
Efficient React Rendering
```

Avoid loading the entire database into the browser.

---

# 44. File Upload Architecture

Conceptually:

```text
React
 ↓
Express
 ↓
Validate File
 ↓
Authorize User
 ↓
Store File on Hostinger Disk
 ↓
Store Metadata in MySQL
 ↓
Return File Reference
```

Never trust the filename or MIME type supplied by the browser.

---

# 45. Deployment Architecture

Production:

```text
Internet
    ↓
pct.permetheon.com
    ↓
Hostinger
    ├── React Frontend
    ├── Express Backend
    ├── MySQL
    └── File Storage
```

The exact Hostinger configuration is defined separately in deployment/development documentation.

---

# 46. Production Requirements

Before production deployment:

```text
[ ] Production build works
[ ] Backend starts
[ ] MySQL connection works
[ ] Environment variables configured
[ ] Authentication works
[ ] Authorization works
[ ] Core routes work
[ ] Task workflow works
[ ] File system works
[ ] Notifications work
[ ] Reports work
[ ] HTTPS works
[ ] No secrets exposed
[ ] Production smoke test passes
```

---

# 47. Source of Truth

When implementing PCT:

```text
Code
    +
Database
    +
Documentation
```

must remain synchronized.

If implementation changes a documented behavior, update the relevant documentation.

---

# 48. Feature Completion Rule

A feature is not complete simply because its UI exists.

A feature is complete when:

```text
Frontend
   +
Backend
   +
Database
   +
Permissions
   +
Error Handling
   +
Testing
   +
Documentation
```

are correctly implemented.

---

# 49. Development Safety Rules

Never:

```text
Delete production data
Drop production tables casually
Expose database credentials
Disable authentication to "make it work"
Bypass authorization
Hardcode secrets
Upload sensitive data into Git
Disable security checks permanently
```

Temporary development bypasses must never reach production.

---

# 50. Project Status

PCT is an internal Permetheon system under active development.

Features may evolve.

When changing architecture or core behavior:

```text
Update Documentation
Update Implementation
Update Tests
Verify Existing Features
```

---

# 51. Master Documentation Map

```text
README.md
│
├── ARCHITECTURE.md
├── ARCHITECTURE_LOG.md
├── PROJECT_OVERVIEW.md
├── PROJECT_SYSTEM.md
│
├── AUTHENTICATION.md
├── ROLE_PERMISSIONS.md
├── SECURITY.md
│
├── API.md
├── ROUTE.md
├── DATABASE.md
│
├── TASK_SYSTEM.md
├── REVIEW_SYSTEM.md
├── ACTIVITY_LOG.md
├── NOTIFICATION_SYSTEM.md
├── FILE_SYSTEM.md
│
├── DASHBOARD.md
├── REPORTS.md
│
├── DEVELOPER_SYSTEM.md
├── DEVELOPMENT.md
├── CODING_STANDARD.md
├── TESTING.md
├── UI_UX.md
│
└── CLAUDE.md
```

---

# 52. Claude's Starting Point

When Claude opens this repository, it should first:

```text
1. Read README.md
2. Read CLAUDE.md
3. Read ARCHITECTURE.md
4. Read PROJECT_OVERVIEW.md
5. Inspect the actual repository structure
6. Compare documentation with implementation
7. Identify existing functionality
8. Only then begin requested work
```

Claude must treat the actual codebase as the implementation source and the documentation as the architectural/specification source.

If documentation and code disagree, investigate before making destructive changes.

---

# 53. Final Architecture

```text
                         PCT
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
   React 18+ Frontend              Express.js Backend
          │                               │
          │                         ┌─────┼─────┐
          │                         │     │     │
          │                         ▼     ▼     ▼
          │                      Auth   Logic  Files
          │                         │     │     │
          └──────────── REST API ───┘     │     │
                                         ▼     ▼
                                       MySQL  Hostinger Disk
```

---

# 54. Final Rule

> **PCT is Permetheon's internal command center for development operations. It must remain simple, reliable, secure, maintainable, and focused on getting development work completed.**

The system should always favor:

```text
Working Software
over
Unnecessary Complexity

Clear Workflow
over
Feature Bloat

Security
over
Convenience

Maintainability
over
Quick Hacks
```

---

**PCT — Permetheon Command Terminal**

**Production:** `pct.permetheon.com`

**Internal Use — Permetheon**
