# PCT — Database Specification

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Database:** MySQL
**Document Type:** Database Architecture & Schema Specification
**Status:** Active
**Version:** 1.0

---

# 1. Purpose

This document defines the database architecture and data standards for PCT.

MySQL is the primary source of truth for application data.

The database stores:

* Users
* Roles
* Projects
* Project members
* Tasks
* Task assignments
* Reviews
* Comments
* Files metadata
* Notifications
* Activity logs
* Other required operational records

Actual uploaded files are stored on the Hostinger filesystem.

MySQL stores their metadata and relationships.

---

# 2. Database Architecture

```text
React
  │
  ▼
Express.js
  │
  ▼
MySQL
  │
  ├── Users
  ├── Projects
  ├── Tasks
  ├── Reviews
  ├── Comments
  ├── Files Metadata
  ├── Notifications
  └── Activity Logs
```

The frontend must never connect directly to MySQL.

---

# 3. Database Engine

Use:

```text
MySQL 8+
```

Preferred storage engine:

```text
InnoDB
```

InnoDB should be used because PCT requires:

* Foreign keys
* Transactions
* Referential integrity
* Reliable concurrent operations

---

# 4. Character Set

Use:

```text
utf8mb4
```

Recommended database/table configuration:

```sql
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci
```

This ensures proper support for international text and symbols.

---

# 5. Naming Convention

Database tables should use:

```text
snake_case
```

Examples:

```text
users
projects
project_members
tasks
task_comments
task_reviews
files
notifications
activity_logs
```

Column names should also use:

```text
snake_case
```

Examples:

```text
created_at
updated_at
user_id
project_id
assigned_to
due_date
```

---

# 6. Primary Keys

Each main table should have a primary key.

Recommended:

```text
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
```

Example:

```sql
id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT
```

The exact integer size may be adjusted if the existing schema already uses another consistent convention.

Do not mix multiple ID strategies unnecessarily.

---

# 7. Timestamp Convention

Tables that represent application entities should generally contain:

```text
created_at
updated_at
```

where appropriate.

Timestamp fields should use:

```text
DATETIME
```

or the project's established equivalent consistently.

Do not mix timestamp conventions randomly across tables.

---

# 8. Core Tables

Initial database architecture:

```text
users
projects
project_members
tasks
task_comments
task_reviews
files
notifications
activity_logs
```

Additional tables may be introduced when a real feature requires them.

Do not create speculative tables for features that do not exist.

---

# 9. Users Table

Table:

```text
users
```

Purpose:

Stores all PCT user accounts.

Recommended structure:

```text
id
name
email
password_hash
role
status
last_login_at
created_at
updated_at
```

Example conceptual schema:

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
);
```

The final implementation should follow the project's actual migration/schema strategy.

---

# 10. User Roles

Initial roles:

```text
ADMIN
TEAM_LEAD
DEVELOPER
```

Roles are stored on the user record initially.

Do not introduce a separate permissions system unless the project actually requires granular permissions beyond the current role model.

---

# 11. User Status

Initial statuses:

```text
ACTIVE
INACTIVE
```

Inactive users cannot authenticate.

Historical records belonging to inactive users must remain intact.

---

# 12. Email Uniqueness

User emails must be unique.

Recommended:

```text
UNIQUE(email)
```

Email comparisons should follow a consistent normalization strategy.

The application should normalize email input appropriately before account creation/login.

---

# 13. Password Storage

The database must NEVER store plain-text passwords.

Only:

```text
password_hash
```

is stored.

Password hashing is handled by the backend.

Refer to:

```text
AUTHENTICATION.md
```

for authentication rules.

---

# 14. Projects Table

Table:

```text
projects
```

Purpose:

Stores internal Permetheon projects.

Recommended fields:

```text
id
name
description
status
priority
start_date
due_date
created_by
created_at
updated_at
```

Possible statuses:

```text
PLANNING
ACTIVE
ON_HOLD
COMPLETED
ARCHIVED
```

The final status set must remain consistent with the application implementation.

---

# 15. Project Relationships

A project can have multiple members.

Relationship:

```text
projects
    │
    └── project_members
              │
              └── users
```

A project can contain multiple tasks.

```text
projects
    │
    └── tasks
```

---

# 16. Project Members Table

Table:

```text
project_members
```

Purpose:

Associates users with projects.

Recommended fields:

```text
id
project_id
user_id
role
created_at
```

Relationship:

```text
projects 1 ──── N project_members N ──── 1 users
```

A unique constraint should prevent duplicate project membership.

Recommended:

```text
UNIQUE(project_id, user_id)
```

---

# 17. Project Member Roles

Project membership may optionally distinguish:

```text
LEAD
MEMBER
```

This is separate from the user's global PCT role.

Example:

```text
Global Role:
DEVELOPER

Project Role:
LEAD
```

Do not confuse project role with system role.

---

# 18. Tasks Table

Table:

```text
tasks
```

Purpose:

Stores developer tasks.

Recommended fields:

```text
id
project_id
title
description
status
priority
created_by
assigned_to
due_date
completed_at
created_at
updated_at
```

---

# 19. Task Status

Initial task lifecycle:

```text
BACKLOG
ASSIGNED
IN_PROGRESS
REVIEW
REVISION_REQUIRED
COMPLETED
```

Expected flow:

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

The application should not randomly introduce additional statuses.

---

# 20. Task Priority

Initial priority levels:

```text
LOW
MEDIUM
HIGH
URGENT
```

Priority must be stored consistently.

Do not use arbitrary free-form priority values.

---

# 21. Task Assignment

Each task may have one primary assigned developer.

Relationship:

```text
users
  │
  └── tasks.assigned_to
```

If multi-developer task assignment is required later, introduce a dedicated task assignment table rather than changing the current model without documentation.

---

# 22. Task Creator

Each task should retain its creator.

Relationship:

```text
tasks.created_by
        ↓
users.id
```

This allows the system to identify who created the task.

---

# 23. Task Comments

Table:

```text
task_comments
```

Purpose:

Stores discussion and communication attached to tasks.

Recommended fields:

```text
id
task_id
user_id
comment
created_at
updated_at
```

Relationship:

```text
tasks
  │
  └── task_comments
           │
           └── users
```

---

# 24. Task Reviews

Table:

```text
task_reviews
```

Purpose:

Stores formal task review decisions.

Recommended fields:

```text
id
task_id
reviewer_id
status
feedback
created_at
```

Review statuses:

```text
APPROVED
REVISION_REQUIRED
```

A review should retain the reviewer and timestamp.

---

# 25. Review Workflow

```text
Developer
    ↓
Task → REVIEW
    ↓
Team Lead / Authorized Reviewer
    │
    ├── APPROVED
    │       ↓
    │   COMPLETED
    │
    └── REVISION_REQUIRED
            ↓
        IN_PROGRESS
```

Historical review records should not be destroyed simply because a task is reviewed again.

---

# 26. Files Table

Table:

```text
files
```

Purpose:

Stores metadata for files physically stored on Hostinger.

Recommended fields:

```text
id
original_name
stored_name
file_path
mime_type
file_size
uploaded_by
entity_type
entity_id
created_at
```

---

# 27. File Storage Architecture

Actual file:

```text
Hostinger Filesystem
```

Example:

```text
/uploads/tasks/abc123.zip
```

Database:

```text
files
```

stores:

```text
original_name = "project.zip"
stored_name   = "abc123.zip"
file_path     = "/uploads/tasks/abc123.zip"
```

---

# 28. File Relationships

Files may belong to different entities.

Possible:

```text
TASK
PROJECT
USER
```

The exact relationship mechanism should follow the final implementation.

If polymorphic metadata is used:

```text
entity_type
entity_id
```

must be validated by backend logic.

---

# 29. File Security

Never allow:

```text
../../
```

or arbitrary filesystem paths.

The backend must generate safe storage paths.

User-provided filenames should not directly determine filesystem locations.

---

# 30. Notifications Table

Table:

```text
notifications
```

Purpose:

Stores user-specific notifications.

Recommended fields:

```text
id
user_id
type
title
message
entity_type
entity_id
is_read
created_at
read_at
```

---

# 31. Notification Relationship

```text
users
  │
  └── notifications
```

A notification belongs to one user.

Users should only be able to access their own notifications unless an explicit administrative rule allows otherwise.

---

# 32. Notification State

Initial state:

```text
is_read = FALSE
```

When read:

```text
is_read = TRUE
read_at = timestamp
```

---

# 33. Activity Logs Table

Table:

```text
activity_logs
```

Purpose:

Stores important business and user actions.

Recommended fields:

```text
id
user_id
action
entity_type
entity_id
description
metadata
created_at
```

---

# 34. Activity Examples

Possible actions:

```text
USER_LOGIN
USER_LOGOUT
LOGIN_FAILED

PROJECT_CREATED
PROJECT_UPDATED

TASK_CREATED
TASK_ASSIGNED
TASK_STATUS_CHANGED
TASK_COMPLETED
TASK_APPROVED
TASK_REVISION_REQUESTED

FILE_UPLOADED

COMMENT_CREATED
```

The exact event list should remain aligned with `ACTIVITY_LOG.md`.

---

# 35. Activity Metadata

Optional metadata may be stored as JSON.

Example:

```json
{
  "old_status": "IN_PROGRESS",
  "new_status": "REVIEW"
}
```

Metadata must never contain:

```text
passwords
password hashes
session secrets
authentication tokens
database credentials
```

---

# 36. Activity Retention

Activity history should generally be retained.

Do not delete activity records merely because the related user/project/task is archived.

Historical records are important for internal auditing and operational visibility.

---

# 37. Foreign Keys

Relationships should use foreign keys where appropriate.

Examples:

```text
tasks.project_id
tasks.created_by
tasks.assigned_to

project_members.project_id
project_members.user_id

task_comments.task_id
task_comments.user_id

task_reviews.task_id
task_reviews.reviewer_id

files.uploaded_by

notifications.user_id

activity_logs.user_id
```

---

# 38. Foreign Key Deletion Strategy

Do not blindly use:

```text
ON DELETE CASCADE
```

for every relationship.

Before choosing a deletion rule, determine whether historical data must be preserved.

For example, deleting a user should not automatically destroy:

```text
Tasks
Reviews
Comments
Activity
```

that were created by that user.

Prefer preserving historical records.

---

# 39. Indexing

Indexes should be added to fields frequently used for:

* Authentication
* Filtering
* Sorting
* Relationships
* Search

Examples:

```text
users.email

tasks.project_id
tasks.assigned_to
tasks.status
tasks.due_date

project_members.project_id
project_members.user_id

task_comments.task_id

task_reviews.task_id

notifications.user_id
notifications.is_read

activity_logs.user_id
activity_logs.entity_type
activity_logs.entity_id
activity_logs.created_at
```

Do not create excessive indexes without a reason.

---

# 40. Composite Indexes

Composite indexes may be used when queries regularly filter by multiple columns.

Example:

```text
tasks(project_id, status)
```

or:

```text
notifications(user_id, is_read)
```

Only create composite indexes based on actual query patterns.

---

# 41. Unique Constraints

Use unique constraints where the business rule requires uniqueness.

Examples:

```text
users.email

project_members(project_id, user_id)
```

Do not rely only on frontend validation for uniqueness.

---

# 42. Data Integrity

Database constraints should help enforce important business rules.

Examples:

```text
Required user email
Unique user email
Required task title
Valid project relationship
Valid task relationship
Valid project membership
```

The backend should still validate business rules before database operations.

---

# 43. Soft Delete

For important historical entities, prefer archiving/status changes instead of physical deletion where appropriate.

Examples:

```text
User → INACTIVE
Project → ARCHIVED
```

Do not automatically add `deleted_at` to every table unless the application actually requires soft deletion.

---

# 44. Transactions

Use transactions when multiple related database operations must succeed together.

Example:

```text
Create Task
     +
Create Activity
     +
Create Notification
```

If the operation is logically atomic, use a MySQL transaction.

---

# 45. Database Connection

Backend should use a shared MySQL connection pool.

Recommended concept:

```text
server/config/database.js
```

Do not create a new database connection for every query/request.

---

# 46. Database Environment Configuration

Database credentials must be stored in environment variables.

Example:

```env
DB_HOST=
DB_PORT=3306
DB_NAME=
DB_USER=
DB_PASSWORD=
```

Never commit real database credentials to Git.

---

# 47. SQL Security

All user-controlled values must use parameterized queries.

Correct:

```js
const [rows] = await db.execute(
  "SELECT * FROM users WHERE email = ?",
  [email]
);
```

Never:

```js
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

This rule is mandatory.

---

# 48. Query Standards

Queries should request only the fields required by the operation.

Prefer:

```sql
SELECT
    id,
    title,
    status,
    priority
FROM tasks
WHERE project_id = ?
```

instead of selecting every column when unnecessary.

---

# 49. Pagination

Large datasets must be paginated.

At minimum, consider pagination for:

```text
Tasks
Projects
Users
Activity Logs
Notifications
Files
```

Do not return thousands of rows to the frontend by default.

---

# 50. Search

Search should generally be performed by MySQL through the backend.

Example:

```text
React
 ↓
GET /api/tasks?search=authentication
 ↓
Express
 ↓
MySQL
```

Do not download all records and perform large-scale filtering in React.

---

# 51. Dashboard Data

Dashboard queries should be optimized for summary data.

Avoid loading complete datasets when only counts are required.

Example:

```sql
SELECT COUNT(*)
FROM tasks
WHERE status = 'REVIEW';
```

instead of loading every review task merely to count them.

---

# 52. Database and Activity Consistency

Business operations that create both data and activity records should consider using a transaction.

Example:

```text
Update Task Status
        +
Create Activity Log
```

The system should avoid situations where the task changes successfully but the required audit event silently fails.

---

# 53. Database Migrations / Schema Changes

Any database schema change must be documented.

Before changing the schema:

1. Review the existing schema.
2. Identify affected tables.
3. Identify affected API endpoints.
4. Identify affected frontend code.
5. Apply the smallest required change.
6. Verify existing data compatibility.
7. Update `DATABASE.md`.

---

# 54. No Destructive Schema Changes Without Verification

Do not:

```text
DROP TABLE
DROP COLUMN
TRUNCATE TABLE
```

without explicit confirmation and a clear migration/data-preservation plan.

Production data must be treated as valuable.

---

# 55. Seed Data

Development seed data may be used for local development.

Seed data must be clearly distinguishable from production data.

Do not insert fake production users or fake operational records into the live database.

---

# 56. Database Backup

Production database backups should be maintained through the hosting/deployment environment or an approved backup strategy.

Database backups are outside the application's normal request flow.

Never store database backups in publicly accessible web directories.

---

# 57. Database Security

Never expose:

```text
MySQL host
MySQL username
MySQL password
Internal database errors
```

to the frontend.

Database access exists only on the backend.

---

# 58. Database Performance Principles

Prefer:

```text
Indexed queries
Parameterized SQL
Pagination
Limited result sets
Efficient joins
Transactions where required
```

Avoid:

```text
SELECT * everywhere
N+1 queries
Unbounded queries
Repeated identical queries
Unnecessary indexes
```

---

# 59. Entity Relationship Overview

Initial relationship model:

```text
                         ┌─────────────┐
                         │    USERS    │
                         └──────┬──────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
       PROJECT_MEMBERS       TASKS          NOTIFICATIONS
              │                 │
              │           ┌─────┴─────┐
              │           │           │
              │           ▼           ▼
              │      COMMENTS      REVIEWS
              │
              ▼
          PROJECTS
              │
              └──────────────► TASKS

USERS ───────────────► FILES
USERS ───────────────► ACTIVITY_LOGS

PROJECTS ────────────► FILES
TASKS ───────────────► FILES
```

---

# 60. Core Relationship Summary

```text
users
  │
  ├── project_members
  │        │
  │        └── projects
  │
  ├── tasks.created_by
  │
  ├── tasks.assigned_to
  │
  ├── task_comments
  │
  ├── task_reviews
  │
  ├── files
  │
  ├── notifications
  │
  └── activity_logs

projects
  │
  ├── project_members
  ├── tasks
  └── files

tasks
  │
  ├── task_comments
  ├── task_reviews
  └── files
```

---

# 61. Recommended Table Order

When creating the schema, the logical creation order is:

```text
1. users
2. projects
3. project_members
4. tasks
5. task_comments
6. task_reviews
7. files
8. notifications
9. activity_logs
```

This makes foreign-key dependencies easier to manage.

---

# 62. Database Source of Truth

The database is the source of truth for:

```text
Users
Projects
Tasks
Assignments
Reviews
Comments
Notifications
Activity
File Metadata
```

The frontend must never maintain an independent permanent copy of business data.

---

# 63. Frontend vs Database

Correct:

```text
React
  ↓
API
  ↓
MySQL
```

Incorrect:

```text
React
  ↓
Hardcoded Business Data
```

Incorrect:

```text
React
  ↓
Direct MySQL Connection
```

---

# 64. Database Completion Criteria

The database implementation is considered complete when:

```text
[ ] MySQL connection works
[ ] Required tables exist
[ ] Primary keys exist
[ ] Foreign keys are correct
[ ] Required unique constraints exist
[ ] Required indexes exist
[ ] Passwords are hashed
[ ] Queries are parameterized
[ ] File metadata is stored correctly
[ ] Physical files remain on Hostinger
[ ] Activity records are supported
[ ] Notification records are supported
[ ] Task/project relationships work
[ ] Historical data is preserved
[ ] Transactions are used where required
[ ] Pagination is implemented for large datasets
[ ] Database credentials are environment-based
[ ] No sensitive database information reaches the frontend
```

---

# 65. Final Database Principle

> **MySQL is the source of truth for PCT application data. Keep the schema relational, simple, indexed, secure, and aligned with the actual business workflow. Store large files on Hostinger and keep only their metadata and relationships in MySQL.**
