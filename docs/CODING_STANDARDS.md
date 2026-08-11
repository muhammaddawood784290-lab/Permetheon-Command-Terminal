# PCT — Coding Standards

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Document Type:** Coding Standards & Development Conventions
**Status:** Active
**Version:** 1.0

---

# 1. Purpose

This document defines the coding standards for PCT.

The goal is to keep the codebase:

* Consistent
* Readable
* Maintainable
* Secure
* Predictable
* Easy to debug
* Easy for multiple developers to work on

All new code should follow these standards unless an existing implementation requires compatibility.

---

# 2. Technology Standard

PCT uses:

```text
Frontend:
React 18+
JavaScript
HTML
Tailwind CSS

Backend:
Node.js
Express.js
JavaScript

Database:
MySQL

Storage:
Hostinger Filesystem
```

Do not introduce another language, framework, database, or major architectural dependency without explicit approval.

---

# 3. General Coding Principles

Follow these principles:

1. Keep code simple.
2. Prefer readability over cleverness.
3. Avoid unnecessary abstraction.
4. Avoid duplicate logic.
5. Keep functions focused.
6. Keep files reasonably sized.
7. Reuse existing utilities and components.
8. Validate external input.
9. Handle errors explicitly.
10. Never hide important failures.
11. Avoid premature optimization.
12. Do not modify unrelated code.

---

# 4. Naming Convention

Names must be descriptive.

Bad:

```js
const x = getData();
const a = users.filter(...);
const d = task.status;
```

Good:

```js
const tasks = getTasks();
const activeUsers = users.filter(...);
const taskStatus = task.status;
```

Avoid meaningless names unless the variable has an extremely small scope.

---

# 5. JavaScript Naming

Use `camelCase` for:

* Variables
* Functions
* Methods
* Object properties

Examples:

```js
const currentUser = {};
const taskCount = 10;

function getTaskById() {}
function updateProject() {}
```

---

# 6. React Component Naming

Use `PascalCase` for React components.

Examples:

```text
TaskCard.jsx
TaskTable.jsx
ProjectCard.jsx
DeveloperList.jsx
Login.jsx
Dashboard.jsx
```

Component names should describe what the component represents.

Avoid:

```text
Thing.jsx
Component1.jsx
Box.jsx
Temp.jsx
```

unless the name is genuinely appropriate.

---

# 7. File Naming

## React Components

```text
PascalCase.jsx
```

Example:

```text
TaskCard.jsx
ProjectDetails.jsx
UserAvatar.jsx
```

## Services

```text
camelCase.js
```

Example:

```text
taskService.js
authService.js
projectService.js
```

## Backend Routes

```text
camelCase.js
```

Example:

```text
taskRoutes.js
projectRoutes.js
authRoutes.js
```

## Controllers

```text
camelCase.js
```

Example:

```text
taskController.js
projectController.js
```

## Middleware

```text
camelCase.js
```

Example:

```text
authMiddleware.js
errorMiddleware.js
```

---

# 8. Constants

Constants that are truly global and immutable may use `UPPER_SNAKE_CASE`.

Example:

```js
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 25;
const TASK_STATUS_REVIEW = "REVIEW";
```

Do not use uppercase for every variable.

---

# 9. Functions

Functions should perform one clear responsibility.

Bad:

```js
function processTask() {
  // validate task
  // update database
  // send notification
  // create activity
  // generate report
  // upload files
}
```

Prefer focused functions:

```js
validateTask();
updateTask();
createActivity();
createNotification();
```

A service may orchestrate these operations where appropriate.

---

# 10. Function Length

Avoid unnecessarily large functions.

If a function becomes difficult to understand, break it into smaller meaningful functions.

Do not split functions merely to make the file look smaller.

The goal is clarity, not artificial fragmentation.

---

# 11. Early Returns

Prefer early returns when they improve readability.

Instead of deeply nested logic:

```js
if (user) {
  if (user.active) {
    if (user.role === "ADMIN") {
      // logic
    }
  }
}
```

Prefer:

```js
if (!user) {
  return;
}

if (!user.active) {
  return;
}

if (user.role !== "ADMIN") {
  return;
}

// logic
```

---

# 12. Avoid Deep Nesting

Avoid excessive:

```text
if
  if
    if
      if
```

Use:

* Early returns
* Helper functions
* Service functions
* Clear conditions

when appropriate.

---

# 13. Comments

Comments should explain **why**, not simply repeat **what** the code does.

Bad:

```js
// Set status to review
task.status = "REVIEW";
```

Good:

```js
// Tasks must enter REVIEW before a team lead can approve them.
task.status = "REVIEW";
```

Avoid comments that become outdated easily.

---

# 14. TODO Comments

Use TODOs only for real follow-up work.

Format:

```js
// TODO: Add bulk task assignment after bulk actions are implemented.
```

Do not leave vague TODOs such as:

```js
// TODO: fix this
```

---

# 15. Dead Code

Do not leave unused:

* Functions
* Variables
* Imports
* Components
* Routes
* Services
* Constants

Remove confirmed dead code when working in the affected area.

Do not delete potentially required code without verification.

---

# 16. Imports

Keep imports clean.

Remove unused imports.

Group imports logically.

Example:

```js
import React from "react";

import { useAuth } from "../hooks/useAuth";
import { getTasks } from "../services/taskService";

import TaskCard from "../components/tasks/TaskCard";
```

Avoid unnecessarily long import paths when an existing project alias is available.

Do not introduce aliases without a clear project-wide reason.

---

# 17. React Standards

React components should remain focused.

A component should generally handle:

* UI rendering
* Local UI state
* User interaction

Business logic that belongs to the backend must not be recreated in React.

---

# 18. React Component Structure

Recommended order:

```text
Imports
↓
Component definition
↓
Hooks
↓
Derived values
↓
Handlers
↓
Effects
↓
Return / JSX
```

Example:

```jsx
import { useEffect, useState } from "react";

function TaskList() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    // ...
  }

  return (
    <div>
      {/* UI */}
    </div>
  );
}

export default TaskList;
```

Follow the project's established style if it differs.

---

# 19. React Hooks

Hooks must follow React's Rules of Hooks.

Do not:

* Call hooks conditionally
* Call hooks inside loops
* Call hooks inside nested functions
* Create unnecessary effects

Use `useEffect` only when synchronization with an external system is actually required.

Do not use `useEffect` for logic that can be calculated directly during rendering.

---

# 20. React State

Keep state as local as possible.

Prefer:

```text
Component State
```

for local UI state.

Use Context for genuinely global state such as:

```text
Authentication
Notifications
```

Do not put every piece of application data into global state.

---

# 21. React Props

Props should be explicit and meaningful.

Bad:

```jsx
<Component data={data} />
```

when the component only needs specific values.

Prefer:

```jsx
<TaskCard
  title={task.title}
  status={task.status}
  priority={task.priority}
/>
```

unless passing the complete object is genuinely useful.

---

# 22. React Lists

Always provide a stable key.

Good:

```jsx
{tasks.map((task) => (
  <TaskCard key={task.id} task={task} />
))}
```

Avoid:

```jsx
key={index}
```

when the list contains persistent data with stable IDs.

---

# 23. Conditional Rendering

Keep conditional UI readable.

Avoid giant nested ternaries.

Bad:

```jsx
{loading ? <Loader /> : error ? <Error /> : data ? <Content /> : <Empty />}
```

Prefer clear logic when complexity grows.

---

# 24. Loading States

Async UI should handle:

```text
Loading
Success
Empty
Error
```

where appropriate.

Do not leave users staring at a blank page while data loads.

---

# 25. Error States

Frontend errors should be user-friendly.

Bad:

```text
AxiosError: Request failed with status code 500
```

Good:

```text
Unable to load tasks. Please try again.
```

Technical details may be logged for developers without exposing them to normal users.

---

# 26. API Calls

API calls should generally live in frontend service modules.

Example:

```text
client/src/services/taskService.js
```

Preferred:

```text
Component
   ↓
taskService
   ↓
API
```

Avoid repeating raw `fetch()` logic across multiple components.

---

# 27. API Base URL

The frontend must not hardcode production URLs throughout the codebase.

Use centralized configuration.

Example:

```js
const API_BASE_URL = import.meta.env.VITE_API_URL;
```

The exact implementation must follow the project's existing setup.

---

# 28. Backend Naming

Use descriptive Express route names.

Good:

```text
/api/tasks
/api/projects
/api/users
/api/reviews
```

Avoid inconsistent naming:

```text
/api/getTasks
/api/doProjectThing
/api/userStuff
```

Prefer REST-style resource naming where appropriate.

---

# 29. Express Routes

Routes should remain lightweight.

Bad:

```js
router.patch("/:id", async (req, res) => {
  // 150 lines of database and business logic
});
```

Preferred:

```js
router.patch("/:id", authMiddleware, updateTask);
```

The controller/service handles the actual operation.

---

# 30. Controllers

Controllers should:

1. Read request information.
2. Call the appropriate service.
3. Return the response.
4. Handle expected errors.

Avoid putting large SQL queries and complex business rules directly inside controllers.

---

# 31. Services

Services contain business logic.

Example:

```js
async function updateTaskStatus(taskId, newStatus, userId) {
  // validation
  // permission checks where appropriate
  // database update
  // activity creation
}
```

Services may coordinate multiple database operations.

---

# 32. Database Queries

Database queries must be parameterized.

Never construct SQL using unsafe string concatenation.

Bad:

```js
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

Good:

```js
const [rows] = await db.execute(
  "SELECT * FROM users WHERE email = ?",
  [email]
);
```

This is mandatory for user-controlled input.

---

# 33. Database Access

Database access should be centralized.

Use a shared database connection/pool configuration.

Do not create a new database connection manually inside every request.

Recommended concept:

```text
server/config/database.js
```

or the equivalent existing project structure.

---

# 34. Transactions

Use database transactions when multiple database operations must succeed or fail together.

Example:

```text
Update Task
+
Create Activity
+
Create Notification
```

If the operations are logically dependent, use a transaction where appropriate.

---

# 35. Database Naming

Follow the schema defined in `DATABASE.md`.

Do not randomly rename:

```text
users
tasks
projects
activity_logs
```

or their columns.

Database naming must remain consistent across:

* SQL
* Backend
* API
* Frontend

---

# 36. SQL Query Standards

Queries should be readable.

Bad:

```js
const q = "SELECT * FROM tasks WHERE p=? AND s=? AND u=?";
```

Prefer:

```js
const query = `
  SELECT *
  FROM tasks
  WHERE project_id = ?
    AND status = ?
    AND assigned_to = ?
`;
```

Use formatting that makes complex queries easy to inspect.

---

# 37. SELECT Rules

Avoid:

```sql
SELECT *
```

when only a small number of columns are required.

Prefer:

```sql
SELECT
    id,
    title,
    status,
    priority
FROM tasks
```

However, `SELECT *` may be acceptable for straightforward internal queries where all columns are genuinely needed.

---

# 38. Input Validation

All external input must be validated.

Sources include:

```text
Request body
Query parameters
URL parameters
File uploads
Headers where relevant
```

Never assume incoming data is valid.

---

# 39. Validation Location

Frontend validation improves UX.

Backend validation protects the system.

Therefore:

```text
Frontend Validation
        +
Backend Validation
```

are both required for important forms.

---

# 40. Error Handling

Do not silently swallow errors.

Bad:

```js
try {
  await saveTask();
} catch (error) {}
```

Good:

```js
try {
  await saveTask();
} catch (error) {
  logger.error(error);
  throw error;
}
```

Use the project's centralized error-handling system.

---

# 41. HTTP Status Codes

Use appropriate HTTP status codes.

Common examples:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

Do not return `200` for every failure.

---

# 42. Authentication Security

Follow `AUTHENTICATION.md`.

Never:

```text
Store plain passwords
Expose password hashes
Expose session secrets
Trust frontend roles
Store authentication secrets in unsafe locations
Log passwords
Log tokens
```

---

# 43. Authorization Security

Every sensitive backend operation must verify authorization.

Example:

```text
Developer
   ↓
DELETE /api/projects/1
   ↓
Permission Check
   ↓
403 Forbidden
```

Never assume that hiding the button in React is enough.

---

# 44. File Upload Standards

File uploads must be validated.

Validate:

```text
File type
File size
Filename
Storage destination
Associated entity
```

Never directly trust a user-provided filesystem path.

---

# 45. File Naming

Uploaded files should receive safe server-generated filenames.

Do not blindly use:

```text
../../something
```

or arbitrary user-provided paths.

Recommended concept:

```text
UUID / generated identifier + safe extension
```

The original filename can be preserved separately as metadata.

---

# 46. File Storage

Actual uploaded files belong on Hostinger storage.

MySQL stores metadata.

Example:

```text
Hostinger:
uploads/tasks/abc123.zip

MySQL:
original_name = "project.zip"
stored_name = "abc123.zip"
path = "uploads/tasks/abc123.zip"
```

---

# 47. Environment Variables

Never hardcode:

```text
Database passwords
Session secrets
Production credentials
Private keys
API secrets
```

Use `.env`.

Example:

```env
NODE_ENV=development
PORT=5000

DB_HOST=
DB_PORT=3306
DB_NAME=
DB_USER=
DB_PASSWORD=

SESSION_SECRET=
```

---

# 48. Console Logging

Avoid random production `console.log()` statements.

Bad:

```js
console.log(user);
console.log(password);
console.log(req);
```

Especially never log:

```text
Passwords
Tokens
Cookies
Secrets
Database credentials
```

Use a controlled logging approach for server-side diagnostics where appropriate.

---

# 49. Security-Sensitive Data

Never expose sensitive data in:

* API responses
* Activity descriptions
* Metadata
* Frontend state
* Console logs
* Error messages

Sensitive data includes:

```text
Passwords
Password hashes
Session secrets
Authentication tokens
Database credentials
Private configuration
```

---

# 50. Tailwind Standards

Tailwind CSS is the primary styling system.

Prefer utility classes directly in components.

Keep class usage readable.

If a class string becomes excessively complex, consider extracting the component or using an appropriate helper already present in the project.

Do not introduce another CSS framework.

---

# 51. Reusable UI

If the same UI pattern appears repeatedly, consider a reusable component.

Examples:

```text
Button
Modal
Input
Select
Badge
Table
Card
Avatar
Dropdown
Toast
EmptyState
LoadingState
```

Do not create abstractions for one-off UI that make the code harder to understand.

---

# 52. Accessibility

Interactive UI should be accessible.

Use:

* Semantic HTML
* Proper buttons
* Labels for inputs
* Accessible form controls
* Keyboard-friendly interactions
* Meaningful alt text for relevant images

Do not use clickable `<div>` elements when a `<button>` is appropriate.

---

# 53. Forms

Forms should:

* Validate required fields
* Show useful validation errors
* Disable submission when appropriate
* Show loading state during submission
* Handle backend errors
* Prevent accidental duplicate submissions

---

# 54. Dates and Times

Use a consistent backend/database representation.

Do not manually format dates differently throughout the application.

Store timestamps consistently in the database and format them for display at the UI layer.

---

# 55. Null and Undefined Handling

Handle potentially missing data explicitly.

Avoid assumptions such as:

```js
user.profile.name
```

when `profile` may not exist.

Use appropriate checks or safe access patterns.

Do not hide genuine data integrity problems with excessive optional chaining.

---

# 56. Boolean Naming

Boolean variables should read naturally.

Good:

```js
isLoading
isAuthenticated
isActive
hasPermission
canEdit
```

Avoid:

```js
loadingFlag
authCheck
activeValue
```

when a clearer boolean name exists.

---

# 57. Async Code

Prefer `async/await` for asynchronous application logic.

Example:

```js
async function loadTasks() {
  const response = await taskService.getTasks();
  return response;
}
```

Handle errors appropriately.

Avoid deeply nested promise chains.

---

# 58. Promise Handling

Do not leave promises unhandled.

Bad:

```js
saveTask();
```

when the result can fail and no handling exists.

Prefer:

```js
await saveTask();
```

inside appropriate async error handling.

---

# 59. Security Over Convenience

If a shortcut creates a security weakness, do not use the shortcut.

Examples:

```text
Disable authorization
Expose database credentials
Trust frontend IDs
Accept arbitrary file paths
Store plain passwords
Return internal errors
```

Security requirements take priority over implementation speed.

---

# 60. Performance

Do not optimize prematurely.

First ensure:

```text
Correctness
Readability
Maintainability
```

Then optimize measurable bottlenecks.

Avoid:

* Unnecessary API calls
* Unnecessary database queries
* Loading huge datasets
* Loading all activity records at once
* Re-rendering large UI trees unnecessarily

---

# 61. Pagination

Large datasets must use pagination.

Relevant areas include:

```text
Tasks
Projects
Users
Activity
Notifications
Files
Reports
```

Do not load thousands of records into the frontend unnecessarily.

---

# 62. Search and Filtering

Filtering should generally happen server-side for large datasets.

Preferred:

```text
React
 ↓
GET /api/tasks?status=REVIEW
 ↓
Express
 ↓
MySQL
```

Avoid downloading the entire database dataset to React just to filter it in the browser.

---

# 63. API Performance

Avoid N+1 database query patterns.

If a page requires related data, consider efficient joins or appropriately structured queries.

Do not automatically make dozens of database queries for a single page.

---

# 64. Code Duplication

Avoid duplicated business logic.

Bad:

```text
taskController.js
  └── task validation

reviewController.js
  └── different copy of task validation

dashboardController.js
  └── third copy
```

Prefer reusable services/utilities where the logic is genuinely shared.

---

# 65. Abstraction Rule

Use abstraction when it reduces complexity.

Do not create:

```text
Factory
Manager
Provider
Adapter
Repository
Wrapper
```

simply because the pattern exists.

Introduce abstractions only when they solve a real problem in PCT.

---

# 66. Backward Compatibility

When modifying an existing feature:

1. Understand current behavior.
2. Identify dependencies.
3. Preserve unrelated behavior.
4. Update consumers if necessary.
5. Test affected flows.

Do not break existing APIs or components accidentally.

---

# 67. Refactoring Rules

Refactoring should have a clear purpose.

Good reasons:

```text
Remove duplication
Fix bug
Improve maintainability
Improve security
Improve performance
Prepare required feature
```

Do not refactor the entire codebase during a small feature task.

---

# 68. Git-Friendly Changes

Changes should remain focused.

Prefer:

```text
Feature
+
Required supporting changes
```

Avoid:

```text
Feature
+
Entire codebase formatting
+
Random renaming
+
Unrelated refactor
```

This makes changes easier to review and debug.

---

# 69. Testing Standard

After implementing a meaningful feature, verify:

### Frontend

```text
Page loads
Navigation works
Forms work
Loading works
Empty state works
Error state works
```

### Backend

```text
Endpoint works
Validation works
Authentication works
Authorization works
Database operation works
Errors are handled
```

### Integration

```text
React
 ↓
Express
 ↓
MySQL
```

works correctly.

---

# 70. Build Verification

Before declaring frontend work complete:

```text
npm run build
```

must succeed where the project provides a build script.

Backend should also start successfully using the project's configured start command.

Do not claim successful verification without actually running it.

---

# 71. Browser Verification

For UI changes, verify:

* Browser console
* Network requests
* API responses
* Layout
* Loading state
* Error state
* Form behavior

A visually correct page with broken API calls is not considered complete.

---

# 72. Production Safety

Before production deployment:

Check:

```text
Environment variables
Database connection
Authentication
Authorization
File permissions
Upload directories
CORS
Build output
Error handling
Production configuration
```

Never deploy development credentials.

---

# 73. Documentation Updates

When code changes affect:

```text
Architecture
API
Database
Authentication
Activity
Deployment
```

update the relevant `.md` document.

Documentation should describe the actual current system.

Do not document features that do not exist.

---

# 74. Claude-Specific Coding Behavior

When Claude is asked to implement a feature:

### First

Inspect:

```text
Existing files
Relevant documentation
Related components
Related routes
Related services
Database schema
```

### Then

Plan the smallest correct implementation.

### Then

Implement.

### Then

Verify.

### Finally

Report:

```text
Files changed
What was implemented
What was tested
Any remaining issues
```

---

# 75. Do Not Claim False Verification

Claude must never say:

```text
"Tested successfully"
"Build passed"
"Database verified"
"Deployment verified"
```

unless the corresponding verification was actually performed.

If something could not be tested, say so clearly.

---

# 76. No Fake Implementations

Do not create fake backend behavior merely to make the UI appear functional.

Avoid:

```js
const tasks = [
  { id: 1, title: "Demo Task" }
];
```

as a permanent substitute for the actual database when the feature is supposed to be connected to MySQL.

Mock data is acceptable only when explicitly requested or when being used temporarily for a clearly identified development purpose.

---

# 77. No Hardcoded Business Data

Do not hardcode:

* Developers
* Projects
* Tasks
* Roles
* Notifications
* Activity
* Reports

into frontend components when these are database-driven entities.

The database is the source of truth.

---

# 78. API and Database Separation

The frontend should not depend on raw database structure unnecessarily.

Example:

Bad:

```text
React assumes every internal MySQL column exists forever.
```

Preferred:

```text
React
 ↓
API Contract
 ↓
Backend
 ↓
Database
```

The API acts as the application's boundary.

---

# 79. Error Messages

User-facing messages should be:

* Clear
* Short
* Actionable
* Non-technical

Example:

```text
Unable to update task. Please try again.
```

Avoid exposing:

```text
ER_DUP_ENTRY
SQLSTATE[23000]
Cannot read properties of undefined
```

to normal users.

---

# 80. Code Quality Checklist

Before considering code complete:

```text
[ ] Naming is clear
[ ] No unused imports
[ ] No dead code introduced
[ ] No unnecessary dependencies
[ ] No duplicate logic
[ ] Validation exists
[ ] Errors are handled
[ ] Authorization is enforced
[ ] Sensitive data is protected
[ ] Database queries are parameterized
[ ] File paths are safe
[ ] Loading states exist where needed
[ ] Error states exist where needed
[ ] Empty states exist where needed
[ ] Relevant documentation is updated
[ ] Build passes
[ ] Relevant functionality was verified
```

---

# 81. Final Rule

The PCT codebase should feel like one system built by one disciplined team.

Every contribution should prioritize:

```text
Clarity
   ↓
Consistency
   ↓
Correctness
   ↓
Security
   ↓
Maintainability
```

Do not optimize for clever code.

Do not optimize for the smallest number of lines.

Optimize for code that another Permetheon developer can understand and safely modify later.

---

# 82. Core Coding Principle

> **Write simple code that is easy to understand, safe to change, and consistent with the existing PCT architecture.**
