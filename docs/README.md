# PCT — Permetheon Command Terminal

**Internal Developer Working CRM**

PCT (Permetheon Command Terminal) is an internal web-based working CRM built for Permetheon's development team.

It replaces static task sheets and scattered internal workflows with a centralized system for managing:

* Projects
* Tasks
* Developers
* Reviews
* Files
* Comments
* Activity Logs
* Notifications
* Internal development workflow

**Production Domain:** `pct.permetheon.com`

---

# 1. Project Purpose

PCT is designed to become the internal working environment for Permetheon's developers.

Instead of relying on:

```text
Task Sheets
Spreadsheets
Chat Messages
Scattered Files
Manual Status Tracking
```

PCT provides a centralized workflow:

```text
Project
   ↓
Task
   ↓
Developer
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

# 2. Core Technology Stack

## Frontend

```text
React 18+
Vite
JavaScript
HTML
Tailwind CSS
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

## File Storage

```text
Hostinger Filesystem
```

The application does not require external APIs for its core functionality.

---

# 3. Architecture

PCT uses a simple application architecture:

```text
┌───────────────────────────────┐
│        React Frontend         │
│     React + Tailwind CSS      │
└───────────────┬───────────────┘
                │
                │ HTTP
                ▼
┌───────────────────────────────┐
│       Express.js Backend      │
│ Authentication + Business     │
│ Logic + API + File Handling   │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        ▼                ▼
┌──────────────┐  ┌───────────────┐
│    MySQL     │  │   Hostinger   │
│   Database   │  │ File Storage  │
└──────────────┘  └───────────────┘
```

### Important

MySQL stores structured application data and file metadata.

Actual uploaded files are stored on the Hostinger filesystem.

```text
MySQL
  ↓
File Metadata

Hostinger
  ↓
Actual File
```

---

# 4. Main Modules

PCT currently consists of the following major systems:

```text
Authentication
Dashboard
Projects
Tasks
Developer System
Reviews
Files
Comments
Activity Logs
Notifications
Users
```

Each module should remain modular and should not unnecessarily duplicate business logic.

---

# 5. Project Structure

Recommended repository structure:

```text
pct/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       ├── utils/
│       ├── context/
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── validators/
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

The structure may evolve during development, but changes should remain consistent with the architecture documentation.

---

# 6. Frontend

The frontend is built with React.

Primary responsibilities:

```text
UI
Navigation
Forms
Tables
Dashboard
Project Views
Task Views
Developer Workspace
Notifications
File Interaction
Loading States
Error States
```

React should not be treated as the authority for:

```text
Authentication
Authorization
Database Security
Business-Critical Validation
```

Those responsibilities belong to the backend.

---

# 7. Backend

The backend uses Node.js with Express.js.

Primary responsibilities:

```text
Authentication
Authorization
API
Business Logic
Validation
Database Operations
File Operations
Activity Logging
Notifications
Error Handling
```

The backend is the authoritative layer of the application.

---

# 8. Database

PCT uses MySQL.

The database stores structured application data such as:

```text
Users
Projects
Project Members
Tasks
Comments
Activity Logs
Notifications
File Metadata
Reviews
Relationships
```

Database rules and schema are documented in:

```text
DATABASE.md
```

---

# 9. File Storage

Uploaded files are stored on the Hostinger server filesystem.

Example:

```text
uploads/
├── projects/
├── tasks/
├── users/
└── general/
```

The exact storage structure is controlled by:

```text
FILE_SYSTEM.md
```

MySQL stores the metadata and relationship of each file.

---

# 10. Authentication

Protected PCT functionality requires authentication.

Authentication handles:

```text
Login
Logout
Session / Authentication State
Password Security
User Identity
Role-Based Access
```

Detailed documentation:

```text
AUTHENTICATION.md
```

---

# 11. Projects

Projects are the primary organizational container for development work.

```text
Project
   ├── Members
   ├── Tasks
   ├── Files
   ├── Comments
   ├── Activity
   └── Notifications
```

Detailed documentation:

```text
PROJECT_SYSTEM.md
```

---

# 12. Tasks

Tasks represent individual units of development work.

Basic workflow:

```text
BACKLOG
   ↓
TODO
   ↓
IN_PROGRESS
   ↓
IN_REVIEW
   ├──► COMPLETED
   │
   └──► REVISION_REQUIRED
             ↓
         IN_PROGRESS
```

Tasks belong to projects and may be assigned to developers.

---

# 13. Developer System

The Developer System provides developers with their working environment.

Developers should be able to quickly see:

```text
Assigned Tasks
Current Work
Tasks Awaiting Review
Revision Requests
Projects
Files
Notifications
Recent Activity
```

Detailed documentation:

```text
DEVELOPER_SYSTEM.md
```

---

# 14. Activity Logs

Activity Logs provide historical records of important actions.

Examples:

```text
Project Created
Task Assigned
Task Status Changed
Task Submitted
Task Approved
Revision Requested
Comment Added
File Uploaded
User Login
```

Activity Logs answer:

> What happened?

Detailed documentation:

```text
ACTIVITY_LOG.md
```

---

# 15. Notifications

Notifications inform users about events requiring attention.

Examples:

```text
New Task Assigned
Task Ready for Review
Task Approved
Revision Required
Project Assignment
Important Comment
System Alert
```

Notifications answer:

> Who needs to know?

Detailed documentation:

```text
NOTIFICATION_SYSTEM.md
```

---

# 16. Activity vs Notification

These systems are intentionally separate.

```text
Activity Log
    ↓
Historical Record

Notification
    ↓
Attention / Action
```

One event may generate both.

Example:

```text
Developer submits task
        │
        ├── Activity Log
        │
        └── Notification to Reviewer
```

---

# 17. API

The frontend communicates with the backend through Express.js APIs.

Example:

```text
React
  ↓
HTTP Request
  ↓
Express.js
  ↓
Business Logic
  ↓
MySQL
  ↓
JSON Response
  ↓
React
```

API documentation:

```text
API.md
```

---

# 18. Development Requirements

Before running the project locally, ensure the development environment has:

```text
Node.js
npm
MySQL
Git
```

Recommended Node.js version should follow the version defined by the project configuration.

---

# 19. Installation

Clone the repository:

```bash
git clone <repository-url>
cd pct
```

Install dependencies:

```bash
npm install
```

If frontend and backend use separate package files:

```bash
cd client
npm install

cd ../server
npm install
```

---

# 20. Environment Configuration

Create the required environment file.

Example:

```bash
cp .env.example .env
```

Configure the required values.

Example:

```env
NODE_ENV=development

PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=pct
DB_USER=root
DB_PASSWORD=

SESSION_SECRET=

UPLOAD_ROOT=
MAX_FILE_SIZE_MB=
```

Never commit real secrets to Git.

---

# 21. Database Setup

Create the MySQL database:

```sql
CREATE DATABASE pct;
```

Run the project's database migrations according to:

```text
DATABASE.md
```

If seed data exists, run the appropriate seed process.

---

# 22. Development

Start the backend:

```bash
npm run server
```

Start the frontend:

```bash
npm run client
```

If the repository uses a combined development command:

```bash
npm run dev
```

The exact commands must match the project's `package.json`.

---

# 23. Production Build

Build the React frontend:

```bash
npm run build
```

The production build should complete without errors.

Before deployment, verify:

```text
Frontend Build
Backend Start
Database Connection
Authentication
File Storage
API Routes
```

---

# 24. Production Deployment

PCT is intended to run on:

```text
pct.permetheon.com
```

Production environment:

```text
React Production Build
        ↓
Express.js
        ↓
MySQL
        ↓
Hostinger Filesystem
```

Production deployment must use the Hostinger Node.js application environment available to the project.

---

# 25. Production Checklist

Before deployment:

```text
[ ] Production environment variables configured
[ ] MySQL database configured
[ ] Database migrations completed
[ ] React production build succeeds
[ ] Express server starts successfully
[ ] Authentication tested
[ ] API endpoints tested
[ ] File uploads tested
[ ] File downloads tested
[ ] Project permissions tested
[ ] Task workflow tested
[ ] Notifications tested
[ ] Activity logs tested
[ ] Domain configured
[ ] HTTPS enabled
```

---

# 26. Security Rules

Never:

```text
Commit .env
Expose database credentials
Trust frontend permissions
Trust frontend user IDs
Build SQL queries using raw user input
Expose private filesystem paths unnecessarily
Allow unauthorized file access
```

Always:

```text
Authenticate protected requests
Authorize backend operations
Validate input
Use parameterized SQL
Protect file access
Handle errors safely
```

---

# 27. Coding Standards

All code must follow:

```text
CODING_STANDARD.md
```

Core principles:

```text
Readable
Modular
Consistent
Secure
Maintainable
Minimal
```

Avoid unnecessary dependencies and architectural complexity.

---

# 28. Documentation

The `/docs` directory contains the project's technical documentation.

Core documents:

```text
PROJECT_OVERVIEW.md
PROJECT_SYSTEM.md
ARCHITECTURE.md
ARCHITECTURE_LOG.md
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
```

Documentation should be updated when architecture or behavior changes.

---

# 29. Development Workflow

Recommended development flow:

```text
Requirement
   ↓
Read Relevant Documentation
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
Documentation Update
   ↓
Production Verification
```

---

# 30. Working With Claude

Before modifying the project, Claude must read the relevant project documentation.

At minimum:

```text
PROJECT_OVERVIEW.md
ARCHITECTURE.md
DATABASE.md
API.md
CODING_STANDARD.md
DEVELOPMENT.md
```

For module-specific work, Claude must also read that module's documentation.

Example:

```text
Task Work
    ↓
Read Task Documentation

File Work
    ↓
Read FILE_SYSTEM.md

Notification Work
    ↓
Read NOTIFICATION_SYSTEM.md
```

Claude must not invent architecture that conflicts with the documented system.

Detailed AI development instructions:

```text
CLAUDE.md
```

---

# 31. Change Management

Before making architectural changes:

```text
1. Identify the current architecture.
2. Check existing documentation.
3. Determine affected modules.
4. Implement the change.
5. Update documentation.
6. Test affected functionality.
7. Verify unrelated functionality.
```

Major architecture changes should be recorded in:

```text
ARCHITECTURE_LOG.md
```

---

# 32. Testing Philosophy

Testing should focus on real application behavior.

Minimum verification:

```text
Authentication
Authorization
CRUD
Task Workflow
Project Workflow
File Handling
Notifications
Activity Logging
Database Relationships
Production Build
```

Do not consider a feature complete only because the UI renders.

---

# 33. Error Handling

The system should provide predictable errors.

Frontend should handle:

```text
Loading
Empty
Error
Unauthorized
Forbidden
Not Found
```

Backend should return consistent API responses.

API conventions are defined in:

```text
API.md
```

---

# 34. Performance Principles

PCT should remain lightweight.

Avoid:

```text
Unnecessary APIs
Unnecessary Libraries
Huge Database Queries
Unlimited File Queries
Excessive Polling
Duplicated Business Logic
```

Prefer:

```text
Simple Queries
Pagination
Indexes
Reusable Services
Modular Components
Efficient API Calls
```

---

# 35. Non-Goals

PCT V1 is not intended to be:

```text
A public SaaS product
A customer-facing CRM
A social platform
An accounting platform
An AI platform
A replacement for every internal Permetheon system
```

Its primary purpose is internal developer work management.

---

# 36. Definition of Done

A feature is considered complete when:

```text
[ ] Requirement implemented
[ ] Database changes completed if required
[ ] Backend implemented
[ ] Frontend implemented
[ ] Authentication handled
[ ] Authorization handled
[ ] Validation implemented
[ ] Error handling implemented
[ ] Loading states implemented
[ ] Activity logging added where required
[ ] Notifications added where required
[ ] Testing completed
[ ] Documentation updated
[ ] Production build succeeds
```

---

# 37. Important Rules

### Rule 1 — Backend is authoritative

Never rely on frontend checks for security.

### Rule 2 — MySQL is authoritative for application data

Do not maintain conflicting application state in multiple places.

### Rule 3 — Files belong to the filesystem

Store file metadata in MySQL and physical files on Hostinger storage.

### Rule 4 — Keep modules separate

Do not put project logic inside notification logic, or authentication logic inside task components.

### Rule 5 — Documentation is part of development

If architecture changes, documentation must change with it.

### Rule 6 — Do not overengineer

PCT is an internal system. Prefer a simple reliable implementation over unnecessary infrastructure.

---

# 38. Current Architecture Summary

```text
                    PCT
                     │
          ┌──────────┴──────────┐
          │                     │
       FRONTEND              BACKEND
          │                     │
   React 18+               Node.js
   Vite                    Express.js
   Tailwind CSS                 │
          │                     │
          └──────── HTTP ───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                  MySQL                Hostinger
                Structured Data       File Storage
                    │                       │
                    └───────────┬───────────┘
                                │
                         PCT Application
```

---

# 39. Final Definition

**Permetheon Command Terminal (PCT)** is an internal developer working CRM built to centralize Permetheon's development operations.

Its core architecture is intentionally simple:

```text
React
   +
Tailwind CSS
   ↓
Express.js
   ↓
MySQL
   +
Hostinger Filesystem
```

The system should remain:

```text
Simple
Secure
Fast
Maintainable
Modular
Developer-focused
```

PCT is not intended to replace the developer — it is intended to give the developer one reliable place to know **what needs to be done, what is being worked on, what needs review, and what has been completed.**
