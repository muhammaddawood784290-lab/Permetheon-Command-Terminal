# PCT — Project Overview

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Organization:** Permetheon
**Project Type:** Internal Developer Working CRM / Command System
**Status:** Active Development
**Version:** 1.0

---

# 1. Project Summary

Permetheon Command Terminal (PCT) is an internal web-based working CRM designed for Permetheon's development team.

PCT replaces the traditional task-sheet approach with a centralized working system where developers can manage their assigned work, projects, tasks, files, reviews, comments, activity history, and internal notifications.

The system is intended to become the primary internal workspace for development task management.

---

# 2. Project Goal

The primary goal of PCT is:

> **Replace static developer task sheets with a structured, interactive, database-driven internal working system.**

Instead of managing work through:

```text
Excel Sheets
Google Sheets
Manual Task Lists
Chat Messages
Scattered Files
```

PCT centralizes the workflow:

```text
Projects
   ↓
Tasks
   ↓
Developers
   ↓
Work
   ↓
Review
   ↓
Approval / Revision
   ↓
Completion
```

---

# 3. Why PCT Exists

Traditional task sheets create several problems:

```text
No centralized state
No reliable history
Difficult task tracking
Poor accountability
Scattered files
Manual status updates
Limited visibility
No structured review workflow
No centralized notifications
```

PCT addresses these problems through a single internal platform.

---

# 4. Primary Users

Initial users include:

```text
Admin
Team Lead / Reviewer
Developer
```

Additional roles may be introduced later.

---

# 5. User Responsibilities

## Admin

Admins manage the overall system.

Typical responsibilities:

```text
Users
Projects
Tasks
Permissions
System configuration
Monitoring
```

Exact permissions are defined by:

```text
AUTHENTICATION.md
DEVELOPER_SYSTEM.md
```

---

## Team Lead / Reviewer

Team Leads or reviewers manage development workflow.

Typical responsibilities:

```text
Review Tasks
Assign Work
Monitor Progress
Request Revisions
Approve Work
Review Activity
```

---

## Developer

Developers primarily use PCT as their daily working environment.

Typical responsibilities:

```text
View Assigned Tasks
Work on Tasks
Update Task Progress
Submit Work for Review
Upload Files
Comment
Handle Revisions
View Notifications
```

---

# 6. Core Modules

PCT initially consists of:

```text
Authentication
Dashboard
Projects
Tasks
Developer Workspace
Reviews
Files
Comments
Activity Logs
Notifications
Users
```

Some modules may be implemented as part of other modules rather than separate pages.

---

# 7. Authentication

Authentication provides controlled access to PCT.

Core functionality:

```text
Login
Logout
Session Management
Password Security
Authentication Middleware
Role-Based Authorization
```

Detailed specification:

```text
AUTHENTICATION.md
```

---

# 8. Dashboard

The dashboard provides an overview of the user's current working state.

Potential information:

```text
Assigned Tasks
Tasks In Progress
Tasks Awaiting Review
Completed Tasks
Pending Actions
Notifications
Recent Activity
Project Overview
```

Detailed specification:

```text
DASHBOARD.md
```

---

# 9. Projects

Projects provide the organizational layer for development work.

Conceptually:

```text
Project
   ↓
Tasks
   ↓
Developers
   ↓
Files
   ↓
Activity
```

Projects may contain:

```text
Project Name
Description
Status
Members
Tasks
Files
Dates
Activity
```

---

# 10. Tasks

Tasks are the primary unit of work inside PCT.

A task may contain:

```text
Title
Description
Project
Assignee
Priority
Status
Deadline
Files
Comments
Activity
Review Information
```

Tasks should be actionable and clearly assigned.

---

# 11. Task Lifecycle

Initial task workflow:

```text
BACKLOG
   ↓
ASSIGNED
   ↓
IN_PROGRESS
   ↓
REVIEW
   ├──────────► COMPLETED
   │
   └──────────► REVISION_REQUIRED
                       ↓
                   IN_PROGRESS
```

The backend controls valid state transitions.

---

# 12. Developer Workspace

The developer workspace is the primary interface for developers.

It should allow developers to quickly understand:

```text
What do I need to do?
What am I currently working on?
What is waiting for review?
What needs revision?
What was recently changed?
What requires my attention?
```

The developer should not need to navigate through multiple unrelated systems to understand their workload.

---

# 13. Review System

The review system manages work submitted by developers.

Basic workflow:

```text
Developer
   ↓
Complete Work
   ↓
Submit for Review
   ↓
Reviewer
   ├── Approve
   │     ↓
   │  COMPLETED
   │
   └── Request Revision
         ↓
      IN_PROGRESS
```

Review actions should be recorded in the Activity Log.

---

# 14. File System

PCT uses Hostinger server storage for physical files.

Architecture:

```text
React
   ↓
Express.js
   ↓
Hostinger Filesystem
```

MySQL stores file metadata.

Example:

```text
Hostinger:
uploads/tasks/2026/08/file.zip

MySQL:
File metadata
```

Detailed specification:

```text
FILE_SYSTEM.md
```

---

# 15. Activity Log

Activity Logs provide an auditable history of important actions.

Examples:

```text
Task Created
Task Assigned
Status Changed
Task Submitted
Task Approved
Revision Requested
Comment Added
File Uploaded
User Logged In
```

Activity logs answer:

> **What happened?**

Detailed specification:

```text
ACTIVITY_LOG.md
```

---

# 16. Notification System

Notifications inform users about events requiring awareness or action.

Examples:

```text
New Task Assigned
Task Ready for Review
Task Approved
Revision Required
Relevant Comment
Project Assignment
System Alert
```

Notifications answer:

> **Who needs to know?**

Detailed specification:

```text
NOTIFICATION_SYSTEM.md
```

---

# 17. Activity vs Notification

These systems must remain conceptually separate.

```text
Activity Log
    ↓
Historical record

Notification
    ↓
Action / awareness
```

Example:

```text
Developer submits Task #102
        │
        ├── Activity:
        │   "Task submitted for review."
        │
        └── Notification:
            "Task #102 is ready for review."
```

---

# 18. Comments

Comments provide contextual communication around development work.

Comments may exist on:

```text
Tasks
Projects
Reviews
```

Comments should remain attached to their relevant entity.

Important comments may generate notifications.

---

# 19. Database

PCT uses MySQL as the primary application database.

MySQL stores:

```text
Users
Projects
Tasks
Comments
Activities
Notifications
File Metadata
Reviews
Relationships
```

MySQL does NOT store large uploaded files as the primary storage mechanism.

Detailed specification:

```text
DATABASE.md
```

---

# 20. Technology Stack

## Frontend

```text
React 18+
Vite
Tailwind CSS
HTML
JavaScript
```

## Backend

```text
Node.js
Express.js
```

## Database

```text
MySQL
```

## Storage

```text
Hostinger Filesystem
```

---

# 21. Architecture

PCT follows a simple three-layer application architecture.

```text
┌───────────────────────────────┐
│          React Frontend       │
│      React + Tailwind CSS     │
└───────────────┬───────────────┘
                │
                │ HTTP
                ▼
┌───────────────────────────────┐
│        Express.js Backend     │
│    Authentication + Logic     │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌──────────────┐  ┌───────────────┐
│    MySQL     │  │   Hostinger   │
│   Database   │  │  File Storage │
└──────────────┘  └───────────────┘
```

Detailed architecture:

```text
ARCHITECTURE.md
```

---

# 22. No External API Requirement

The initial PCT implementation does not require external APIs.

Core operations remain internal:

```text
React
 ↓
Express
 ↓
MySQL
 ↓
Hostinger Filesystem
```

This reduces:

```text
External Dependencies
API Costs
Integration Complexity
External Failure Points
```

---

# 23. API Layer

React communicates with the backend through Express API endpoints.

Example:

```text
React
 ↓
GET /api/tasks
 ↓
Express
 ↓
MySQL
 ↓
JSON Response
 ↓
React
```

API definitions are maintained separately in:

```text
API.md
```

The backend additionally exposes one operational endpoint outside the
`/api` prefix — `GET /metrics` — for Prometheus scraping. It returns
process-level metrics in the Prometheus text exposition format and does
not require authentication. See `API.md §20` for the response shape and
the list of exposed metrics.

---

# 24. Backend Responsibilities

Express.js is responsible for:

```text
Authentication
Authorization
Validation
Business Logic
Database Access
Filesystem Access
File Uploads
File Downloads
Activity Logging
Notifications
API Responses
Error Handling
```

---

# 25. Frontend Responsibilities

React is responsible for:

```text
User Interface
Navigation
Forms
Tables
Task Views
Dashboard
Notifications UI
File Selection
Loading States
Error States
User Interactions
```

React is not responsible for authoritative security decisions.

---

# 26. Security Model

Security is enforced primarily by the backend.

Important principles:

```text
Authenticate every protected request
Authorize every protected operation
Validate user input
Use parameterized SQL
Protect filesystem paths
Protect uploaded files
Never expose credentials
Never trust client-provided roles
```

---

# 27. File Storage Model

PCT uses a hybrid database/filesystem approach.

```text
MySQL
   │
   ├── File ID
   ├── Filename
   ├── Path
   ├── Size
   ├── MIME Type
   ├── Owner
   └── Entity Relationship

Hostinger
   │
   └── Actual File
```

This allows MySQL to manage relationships without storing large binary objects unnecessarily.

---

# 28. Domain

Production domain:

```text
pct.permetheon.com
```

The application should be deployed and configured for this domain.

---

# 29. Hosting

PCT is intended to run on Permetheon's Hostinger environment.

Hostinger provides:

```text
Node.js Application
MySQL
Filesystem Storage
Domain
```

The production environment should be configured according to Hostinger's available Node.js deployment functionality.

---

# 30. Storage Capacity

The current environment has approximately:

```text
50 GB
```

of available disk space for application file storage.

Storage is considered a finite resource.

PCT should not assume unlimited file storage.

---

# 31. Development Environment

Developers may run frontend and backend independently during development.

Typical structure:

```text
Frontend:
React + Vite

Backend:
Node.js + Express

Database:
MySQL
```

Example:

```text
Frontend:
localhost:5173

Backend:
localhost:5000
```

Actual ports are configuration-dependent.

---

# 32. Production Environment

Production architecture:

```text
pct.permetheon.com
        │
        ▼
React Production Build
        │
        ▼
Express.js
        │
        ├────► MySQL
        │
        └────► Hostinger Filesystem
```

---

# 33. Environment Variables

Environment-specific values must not be hardcoded.

Examples:

```text
NODE_ENV
PORT
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
SESSION_SECRET
UPLOAD_ROOT
MAX_FILE_SIZE_MB
```

Exact environment variables are defined by the relevant modules.

---

# 34. Project Structure

Recommended high-level structure:

```text
pct/
│
├── client/
│   ├── public/
│   └── src/
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
├── database/
│   ├── migrations/
│   └── seeds/
│
├── uploads/
│
├── docs/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

The actual repository structure may evolve as implementation progresses.

---

# 35. Documentation System

PCT maintains dedicated Markdown documentation.

Important documents include:

```text
PROJECT_OVERVIEW.md
ARCHITECTURE.md
ARCHITECTURE_LOG.md
API.md
ACTIVITY_LOG.md
AUTHENTICATION.md
CODING_STANDARD.md
DASHBOARD.md
DATABASE.md
DEVELOPER_SYSTEM.md
DEVELOPMENT.md
FILE_SYSTEM.md
NOTIFICATION_SYSTEM.md
```

Each document should have a specific responsibility.

---

# 36. Documentation Principle

Do not duplicate entire specifications across documents.

Example:

```text
DATABASE.md
```

owns database details.

```text
API.md
```

owns endpoint definitions.

```text
FILE_SYSTEM.md
```

owns storage behavior.

`PROJECT_OVERVIEW.md` should provide the high-level relationship between them.

---

# 37. Development Workflow

PCT development follows:

```text
Requirement
   ↓
Documentation Review
   ↓
Architecture Review
   ↓
Database
   ↓
Backend
   ↓
Frontend
   ↓
Integration
   ↓
Testing
   ↓
Documentation
   ↓
Deployment
```

Detailed workflow:

```text
DEVELOPMENT.md
```

---

# 38. Coding Standards

All implementation should follow:

```text
CODING_STANDARD.md
```

Core expectations:

```text
Readable
Modular
Secure
Consistent
Maintainable
```

---

# 39. Version Control

Git should be used for source control.

Recommended branches:

```text
main
feature/<feature-name>
```

Examples:

```text
feature/authentication
feature/task-management
feature/dashboard
feature/file-system
```

---

# 40. Deployment Workflow

Production deployment should follow:

```text
Development
    ↓
Local Testing
    ↓
Build
    ↓
Backend Verification
    ↓
Database Verification
    ↓
Deployment
    ↓
Production Smoke Test
```

Never deploy known-broken code intentionally.

---

# 41. Definition of Done

A feature is considered complete when:

```text
[ ] Requirement implemented
[ ] Database implemented if required
[ ] Backend implemented
[ ] Frontend implemented
[ ] Authentication implemented where required
[ ] Authorization implemented where required
[ ] Validation implemented
[ ] Error handling implemented
[ ] Loading states implemented
[ ] Activity logging implemented where required
[ ] Notifications implemented where required
[ ] Testing completed
[ ] Related functionality checked
[ ] Documentation updated
[ ] Production build succeeds
```

---

# 42. Non-Goals

PCT V1 is NOT intended to become:

```text
A public SaaS platform
A general project-management platform
A customer-facing CRM
An AI assistant
A communication platform
A complete accounting system
A replacement for every Permetheon internal tool
```

The initial focus is internal developer work management.

---

# 43. Scope Control

New features should be evaluated against:

```text
Does it improve developer workflow?
Does it support project/task management?
Does it improve visibility?
Does it improve accountability?
Does it belong inside PCT?
```

If not, it should not automatically become part of PCT.

---

# 44. Future Expansion

Potential future capabilities include:

```text
Advanced Analytics
Developer Performance Metrics
Automated Reports
Email Notifications
Push Notifications
Advanced Search
Advanced Filtering
Calendar Integration
Time Tracking
Deployment Tracking
CI/CD Integration
```

These are future possibilities, not V1 requirements.

---

# 45. Core Product Principle

PCT should feel like a working internal command center rather than a static task management page.

The system should answer:

```text
What is happening?

Who is working on it?

What needs to be done?

What is blocked?

What is waiting for review?

What needs revision?

What has been completed?

Who needs to take action?
```

---

# 46. Final Architecture Principle

> **Keep the system simple: React handles the interface, Express handles business logic and security, MySQL handles structured data, and Hostinger handles physical file storage.**

No unnecessary external APIs, services, or architectural complexity should be introduced unless a real requirement justifies them.

---

# 47. Final Project Definition

> **Permetheon Command Terminal (PCT) is Permetheon's internal developer working CRM that centralizes projects, tasks, developers, reviews, files, activity history, and notifications into one controlled, database-driven workspace.**

The objective is to replace fragmented task-sheet workflows with a reliable internal system that developers can use as part of their daily work.
