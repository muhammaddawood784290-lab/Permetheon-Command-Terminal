# PCT — Testing System

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Production Domain:** `pct.permetheon.com`
**Stack:** React 18+, Tailwind CSS, Express.js, MySQL
**Document Type:** Testing & Quality Assurance Specification
**Status:** Active Development
**Version:** 1.0

---

# 1. Purpose

This document defines the testing strategy for PCT.

Testing must verify that:

```text
Frontend
Backend
Database
Authentication
Authorization
Task System
Project System
Review System
Notification System
File System
Reports
Activity Logs
```

work correctly together.

The goal is not only to verify that the application loads, but that every important workflow behaves correctly under normal, invalid, unauthorized, and edge-case conditions.

---

# 2. Testing Principles

PCT follows these principles:

```text
1. Test functionality, not only UI.
2. Test backend rules independently from React.
3. Never trust frontend validation.
4. Test permissions with multiple roles.
5. Test failure states.
6. Test real database behavior.
7. Test important workflows end-to-end.
8. Fix root causes instead of hiding errors.
9. Never consider a feature complete without verification.
10. Production deployment must be tested separately.
```

---

# 3. Testing Layers

PCT testing is divided into:

```text
Unit Testing
Integration Testing
API Testing
Database Testing
Frontend Testing
Authentication Testing
Authorization Testing
Security Testing
File System Testing
Workflow Testing
End-to-End Testing
Regression Testing
Performance Testing
Deployment Testing
```

---

# 4. Testing Environment

Testing should be performed in an environment that is as close to production as practical.

Recommended:

```text
Development
    ↓
Testing / Staging
    ↓
Production
```

Production should not be used as the primary development/testing environment.

---

# 5. Test Data

Testing should use dedicated test data.

Examples:

```text
Test Admin
Test Team Lead
Test Developer
Test Project
Test Tasks
Test Reviews
Test Files
Test Notifications
```

Never use real production credentials or sensitive production data for normal testing.

---

# 6. Test Accounts

At minimum, create test accounts for:

```text
ADMIN
TEAM_LEAD
DEVELOPER
```

If additional roles exist, each should have a dedicated test account.

---

# 7. Test Account Isolation

Test accounts must not accidentally access production-sensitive data.

Example:

```text
Testing User
      ↓
Testing Project
      ↓
Testing Tasks
```

not:

```text
Testing User
      ↓
Real Client Data
```

---

# 8. Unit Testing

Unit tests verify individual functions or isolated pieces of logic.

Potential targets:

```text
Validation Functions
Permission Functions
Status Transition Logic
Date Calculations
Priority Logic
Utility Functions
Formatting Functions
```

Example:

```text
canTransitionTaskStatus(
    IN_PROGRESS,
    IN_REVIEW
)
```

should return:

```text
true
```

while an invalid transition should return:

```text
false
```

---

# 9. Unit Test Requirements

Unit tests should:

```text
Be deterministic
Be isolated
Have predictable inputs
Have predictable outputs
Avoid unnecessary external dependencies
```

---

# 10. Backend Unit Testing

Backend unit tests should cover:

```text
Authentication Logic
Authorization Logic
Validation
Task State Machine
Permission Checks
Date/Deadline Logic
File Validation
Notification Rules
Report Calculations
```

---

# 11. Frontend Unit Testing

Frontend unit tests may cover:

```text
Components
Form Validation
State Management
Utility Functions
Conditional Rendering
Permission-Based UI
Formatting
```

Do not rely on frontend tests to prove backend authorization.

---

# 12. Integration Testing

Integration tests verify multiple application components working together.

Examples:

```text
Express API
    ↓
Service
    ↓
MySQL
```

or:

```text
React
    ↓
API
    ↓
Database
```

---

# 13. Database Integration Testing

Verify:

```text
Create
Read
Update
Delete
Relationships
Foreign Keys
Constraints
Indexes
Transactions where applicable
```

---

# 14. API Testing

Every important API endpoint should be tested.

Tests should include:

```text
Valid Request
Invalid Request
Missing Required Fields
Unauthorized Request
Forbidden Request
Non-existent Resource
Duplicate Data
Malformed Data
Boundary Values
```

---

# 15. API Response Testing

Verify:

```text
HTTP Status
Response Structure
Success/Error Format
Returned Data
Validation Errors
Permission Errors
```

Example:

```text
GET /api/tasks/100
```

should return a predictable response when Task #100 exists.

---

# 16. Authentication API Tests

Test:

```text
Valid Login
Invalid Password
Invalid Email
Missing Credentials
Disabled Account
Logout
Expired Session/Token
Invalid Session/Token
```

---

# 17. Authorization API Tests

For every protected endpoint test:

```text
Admin
Team Lead
Developer
Unauthenticated User
Unauthorized User
```

Example:

```text
DELETE /api/tasks/:id
```

must reject users without deletion permission.

---

# 18. IDOR Testing

Test whether users can access resources by changing IDs.

Example:

```text
/api/tasks/100
```

change to:

```text
/api/tasks/101
```

A user must only receive Task #101 if they are authorized to access it.

---

# 19. Task System Testing

Test the complete task lifecycle:

```text
Create
 ↓
TODO
 ↓
IN_PROGRESS
 ↓
IN_REVIEW
 ↓
APPROVED
 ↓
COMPLETED
```

Also test:

```text
REVISION_REQUIRED
BLOCKED
CANCELLED
REOPENED
```

---

# 20. Task Status Testing

Valid transitions must succeed.

Example:

```text
TODO → IN_PROGRESS
IN_PROGRESS → IN_REVIEW
IN_REVIEW → COMPLETED
IN_REVIEW → REVISION_REQUIRED
REVISION_REQUIRED → IN_PROGRESS
IN_PROGRESS → BLOCKED
BLOCKED → IN_PROGRESS
```

Invalid transitions must be rejected.

---

# 21. Task Assignment Testing

Test:

```text
Assign Task
Reassign Task
Remove Assignment
Unauthorized Assignment
Assignment to Invalid User
Assignment to Unauthorized Project User
```

---

# 22. Task Deadline Testing

Test:

```text
No Deadline
Future Deadline
Today's Deadline
Past Deadline
Completed Task with Past Deadline
Blocked Task with Past Deadline
```

Verify overdue calculations.

---

# 23. Task Priority Testing

Test:

```text
LOW
MEDIUM
HIGH
URGENT
```

Verify:

```text
Creation
Update
Filtering
Sorting
Display
Permissions
```

---

# 24. Task Dependency Testing

If dependencies are enabled, test:

```text
Create Dependency
View Dependency
Remove Dependency
Invalid Dependency
Self Dependency
Circular Dependency
Completed Dependency
Blocked Dependency
```

---

# 25. Comment Testing

Test:

```text
Create Comment
View Comment
Edit Own Comment
Unauthorized Edit
Delete Comment if supported
Empty Comment
Very Long Comment
Special Characters
HTML Input
Script Input
```

---

# 26. Review System Testing

Test:

```text
Submit for Review
Approve
Request Revision
Add Review Feedback
View Review History
Resubmit After Revision
Unauthorized Review
Self-Approval Prevention
```

---

# 27. Self-Approval Testing

A developer must not be able to approve their own work if the project requires independent review.

Example:

```text
Developer A
    ↓
Submits Task
    ↓
IN_REVIEW
    ↓
Developer A attempts approval
    ↓
DENIED
```

---

# 28. File System Testing

Test:

```text
Upload File
Download File
View File
Delete File
Unauthorized File Access
Invalid File Type
Oversized File
Invalid Filename
Path Traversal Attempt
Missing File
```

---

# 29. File Authorization Testing

A user who cannot access a task/project must not be able to access its private files by guessing the file URL or identifier.

Test:

```text
Authorized User → Allowed
Unauthorized User → Denied
```

---

# 30. Notification Testing

Test:

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

Verify:

```text
Notification Created
Notification Displayed
Read State
Navigation
Permission Scope
```

---

# 31. Activity Log Testing

Verify that important actions create activity records.

Examples:

```text
User Login
Task Created
Task Assigned
Task Status Changed
Task Updated
Review Submitted
Review Approved
Revision Requested
File Uploaded
File Deleted
Project Updated
Role Changed
```

---

# 32. Activity Integrity

Activity records should correctly identify:

```text
Actor
Action
Target
Timestamp
Relevant Metadata
```

Example:

```text
Developer A
changed
Task #1042
IN_PROGRESS → IN_REVIEW
```

---

# 33. Project System Testing

Test:

```text
Create Project
Edit Project
Archive Project
View Project
Assign Developers
Create Project Tasks
Project Permissions
Project Activity
```

---

# 34. Project Access Testing

Test that users cannot access projects outside their permitted scope.

Example:

```text
Developer A
    ↓
Project A → Allowed
Project B → Denied
```

---

# 35. Role Testing

Every role must be tested independently.

Minimum:

```text
Admin
Team Lead
Developer
```

For each role verify:

```text
Visible Pages
Visible Actions
API Permissions
Project Access
Task Access
Review Access
File Access
Reports
Settings
```

---

# 36. Permission Matrix Testing

Compare implementation against:

```text
ROLE_PERMISSIONS.md
```

Every permission should be tested at the API level.

Frontend visibility is not enough.

---

# 37. Dashboard Testing

Test dashboard metrics such as:

```text
Total Tasks
Active Tasks
Completed Tasks
Overdue Tasks
Tasks In Review
Blocked Tasks
Projects
Developer Workload
```

Verify numbers against database records.

---

# 38. Dashboard Filtering

If dashboard filters exist, test:

```text
Project
Developer
Status
Priority
Date Range
```

Verify that metrics change correctly.

---

# 39. Reports Testing

Test:

```text
Task Reports
Project Reports
Developer Reports
Completion Statistics
Overdue Statistics
Review Statistics
```

Report values must match the underlying database.

---

# 40. Search Testing

Test:

```text
Exact Search
Partial Search
Case Differences
Special Characters
Empty Search
No Results
Large Result Set
```

---

# 41. Filtering Testing

Test individual and combined filters.

Example:

```text
Project = Website
Status = IN_PROGRESS
Priority = HIGH
Developer = User A
```

Verify that every returned result satisfies all filters.

---

# 42. Pagination Testing

Test:

```text
First Page
Middle Page
Last Page
Empty Page
Large Page Number
Invalid Page Number
Maximum Limit
```

Verify that records are not duplicated or skipped unexpectedly.

---

# 43. Sorting Testing

Test sorting by:

```text
Created Date
Updated Date
Deadline
Priority
Status
```

Test:

```text
Ascending
Descending
```

---

# 44. Form Validation Testing

All forms should be tested with:

```text
Valid Data
Missing Fields
Empty Strings
Whitespace
Long Strings
Invalid Characters
Invalid IDs
Invalid Dates
Invalid Values
```

---

# 45. XSS Testing

Use harmless test payloads such as:

```text
<script>alert('test')</script>
```

Verify that it is not executed when rendered as user content.

Test:

```text
Task Title
Description
Comments
Review Feedback
Project Description
```

---

# 46. SQL Injection Testing

Test malicious input patterns against searchable and filterable fields.

Examples:

```text
'
"
' OR '1'='1
```

The application must not execute user input as SQL.

---

# 47. Authentication Security Testing

Test:

```text
Wrong Password
Repeated Failed Login
Expired Authentication
Invalid Authentication
Logout Then API Request
Disabled Account
```

Verify that protected resources remain protected.

---

# 48. Brute Force Testing

Verify that repeated authentication failures trigger the configured rate-limit/protection mechanism.

Do not perform uncontrolled load testing against production.

---

# 49. CSRF Testing

If cookie-based authentication is used, verify CSRF protection for state-changing operations.

Test:

```text
POST
PUT
PATCH
DELETE
```

---

# 50. CORS Testing

Verify:

```text
Allowed Origin → Allowed
Unknown Origin → Denied
```

Production configuration must not unnecessarily allow arbitrary origins.

---

# 51. Security Header Testing

Verify that production responses contain appropriate security headers.

Check:

```text
HSTS
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Frame Protection
```

---

# 52. Error Handling Testing

Test:

```text
Invalid API Route
Invalid Database Request
Missing Resource
Unauthorized Request
Forbidden Request
Malformed JSON
Server Error
```

Verify that users receive safe error messages.

---

# 53. No Secret Exposure Testing

Search frontend bundles and API responses for:

```text
Database Password
Authentication Secrets
Private Keys
Server Secrets
Environment Variables
```

Nothing sensitive should reach the browser.

---

# 54. Browser Testing

Test supported modern browsers.

Minimum:

```text
Google Chrome
Microsoft Edge
Mozilla Firefox
```

Safari should be considered where relevant.

---

# 55. Responsive Testing

Test:

```text
Desktop
Laptop
Tablet
Mobile
```

Important screens:

```text
Login
Dashboard
Projects
Tasks
Task Details
Reviews
Notifications
Reports
Settings
```

---

# 56. UI Testing

Verify:

```text
Buttons
Forms
Dropdowns
Modals
Tables
Cards
Navigation
Sidebars
Notifications
Loading States
Empty States
Error States
```

---

# 57. Accessibility Testing

Verify basic accessibility:

```text
Keyboard Navigation
Visible Focus
Form Labels
Button Labels
Readable Contrast
Semantic HTML
Error Messages
```

Interactive controls should be usable without relying only on color.

---

# 58. Performance Testing

Test:

```text
Dashboard Load
Task List Load
Project List Load
Search
Filtering
Reports
Large Task Sets
```

Watch for:

```text
Slow API
Large SQL Queries
Excessive API Requests
Large Frontend Bundles
Unnecessary React Re-renders
```

---

# 59. Database Performance Testing

Test realistic data volumes.

Example:

```text
1,000 Tasks
5,000 Tasks
10,000 Tasks
```

Monitor:

```text
Query Time
Indexes
Memory
CPU
Pagination
```

The application should not load thousands of records into the browser unnecessarily.

---

# 60. API Performance Testing

Important endpoints:

```text
GET /api/tasks
GET /api/projects
GET /api/dashboard
GET /api/reports
```

Verify acceptable response times under normal expected load.

---

# 61. Concurrency Testing

Test multiple users performing actions at the same time.

Example:

```text
Developer A
    ↓
Updates Task

Developer B
    ↓
Reviews Same Task
```

Verify that data is not silently overwritten.

---

# 62. Race Condition Testing

Important cases:

```text
Two users assign same task
Two users change task status
Two users submit reviews
Two users edit same record
```

The backend must maintain data integrity.

---

# 63. Regression Testing

Every major feature change should trigger regression testing.

Minimum regression areas:

```text
Authentication
Dashboard
Projects
Tasks
Reviews
Files
Notifications
Reports
Permissions
Activity Logs
```

---

# 64. Smoke Testing

After every major deployment, perform a smoke test.

Minimum:

```text
[ ] Application loads
[ ] Login works
[ ] Dashboard loads
[ ] Projects load
[ ] Tasks load
[ ] Task creation works
[ ] Task update works
[ ] Logout works
```

---

# 65. Production Smoke Test

After deployment to:

```text
https://pct.permetheon.com
```

verify:

```text
[ ] HTTPS works
[ ] React application loads
[ ] API responds
[ ] Database connection works
[ ] Login works
[ ] Dashboard works
[ ] Task workflow works
[ ] File access works
[ ] Notifications work
[ ] Logout works
```

---

# 66. Deployment Testing

Before production:

```text
[ ] Production build succeeds
[ ] Server starts correctly
[ ] Environment variables exist
[ ] MySQL connection works
[ ] Migrations completed
[ ] Static assets load
[ ] API routes work
[ ] HTTPS works
[ ] CORS works
[ ] Security headers work
```

---

# 67. Build Testing

Frontend:

```text
npm run build
```

Backend should be verified using the project's configured production/start command.

Build failures must be resolved before deployment.

---

# 68. Console Error Testing

Production frontend should not contain unexpected:

```text
JavaScript Errors
Unhandled Promise Rejections
Failed API Requests
Missing Assets
React Warnings
```

Expected warnings should be documented where necessary.

---

# 69. Network Testing

Browser DevTools should be used to verify:

```text
API Requests
Response Codes
Request Payloads
Response Payloads
Failed Requests
Authentication State
```

Sensitive information must not appear unnecessarily.

---

# 70. Database Testing Checklist

```text
[ ] Tables exist
[ ] Foreign keys work
[ ] Constraints work
[ ] Required fields enforced
[ ] Duplicate prevention works
[ ] Indexes exist where required
[ ] Transactions work where required
[ ] Soft deletion works if implemented
[ ] Test data is correct
```

---

# 71. API Test Checklist

```text
[ ] GET endpoints
[ ] POST endpoints
[ ] PATCH endpoints
[ ] DELETE endpoints
[ ] Authentication
[ ] Authorization
[ ] Validation
[ ] Error responses
[ ] Pagination
[ ] Filtering
[ ] Sorting
```

---

# 72. Task Test Checklist

```text
[ ] Create
[ ] Read
[ ] Update
[ ] Assign
[ ] Reassign
[ ] Status change
[ ] Priority
[ ] Deadline
[ ] Comments
[ ] Files
[ ] Dependencies
[ ] Review
[ ] Revision
[ ] Completion
[ ] Cancellation
[ ] Reopen
```

---

# 73. Review Test Checklist

```text
[ ] Submit review
[ ] Approve
[ ] Request revision
[ ] Feedback
[ ] Review history
[ ] Permission checks
[ ] Self-approval prevention
```

---

# 74. Permission Test Checklist

For every important action:

```text
Admin
Team Lead
Developer
Unauthenticated
Unauthorized
```

Expected results must match:

```text
ROLE_PERMISSIONS.md
```

---

# 75. File Test Checklist

```text
[ ] Upload
[ ] Download
[ ] View
[ ] Delete
[ ] Authorization
[ ] Invalid extension
[ ] Invalid MIME type
[ ] Large file
[ ] Unsafe filename
[ ] Path traversal
[ ] Missing file
```

---

# 76. Notification Test Checklist

```text
[ ] Notification creation
[ ] Notification display
[ ] Read/unread state
[ ] Correct recipient
[ ] Correct task/project link
[ ] Unauthorized notification access prevented
```

---

# 77. Activity Log Test Checklist

```text
[ ] Login event
[ ] Task creation
[ ] Task assignment
[ ] Status change
[ ] Review action
[ ] File action
[ ] Project action
[ ] Permission action
[ ] Correct actor
[ ] Correct timestamp
```

---

# 78. Test Case Format

Each formal test case should follow:

```text
Test ID:
Feature:
Scenario:
Preconditions:
Steps:
Expected Result:
Actual Result:
Status:
Notes:
```

Example:

```text
Test ID:
TASK-001

Feature:
Task Creation

Scenario:
Create a valid task

Preconditions:
Authenticated Team Lead

Steps:
1. Open Projects
2. Open project
3. Click Create Task
4. Enter valid data
5. Submit

Expected Result:
Task is created and appears in the task list.

Status:
PASS
```

---

# 79. Test Statuses

Use:

```text
PASS
FAIL
BLOCKED
SKIPPED
NOT_TESTED
```

---

# 80. Bug Classification

Bugs should be classified as:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

---

# 81. CRITICAL Bug

Examples:

```text
Application unavailable
Authentication bypass
Database corruption
Unauthorized access to sensitive data
Major production failure
```

Critical bugs block production release.

---

# 82. HIGH Bug

Examples:

```text
Major feature broken
Important permission bypass
Task workflow failure
File access vulnerability
Major data integrity issue
```

High bugs normally block release.

---

# 83. MEDIUM Bug

Examples:

```text
Feature partially broken
Incorrect dashboard metric
Non-critical workflow issue
Significant UI issue
```

Release decision depends on impact.

---

# 84. LOW Bug

Examples:

```text
Minor UI issue
Spacing issue
Small visual inconsistency
Non-critical wording issue
```

Low bugs normally do not block release.

---

# 85. Bug Reporting Format

```text
Bug ID:
Title:
Severity:
Environment:
User Role:
Feature:
Steps to Reproduce:
Expected Result:
Actual Result:
Screenshots:
Logs:
Status:
```

---

# 86. Bug Fix Verification

After fixing a bug:

```text
Original Test
    ↓
PASS
    ↓
Regression Test
    ↓
PASS
```

Do not close a bug only because the code was changed.

---

# 87. Definition of Test Complete

A feature is considered tested when:

```text
[ ] Happy path works
[ ] Validation works
[ ] Error path works
[ ] Permission checks work
[ ] Database behavior works
[ ] API behavior works
[ ] UI behavior works
[ ] Security checks pass
[ ] Responsive behavior verified
[ ] Regression checks pass
```

---

# 88. Definition of Release Ready

PCT is release-ready when:

```text
[ ] Production build succeeds
[ ] No critical bugs
[ ] No high-severity unresolved security issues
[ ] Authentication tested
[ ] Authorization tested
[ ] Core workflows tested
[ ] Database tested
[ ] API tested
[ ] File system tested
[ ] Notifications tested
[ ] Reports tested
[ ] Activity logs tested
[ ] Production smoke test passes
[ ] Backup strategy verified
```

---

# 89. Final QA Workflow

```text
Feature Development
        ↓
Developer Testing
        ↓
Unit Testing
        ↓
Integration Testing
        ↓
API Testing
        ↓
Permission Testing
        ↓
Security Testing
        ↓
UI Testing
        ↓
End-to-End Testing
        ↓
Regression Testing
        ↓
Production Build
        ↓
Deployment
        ↓
Production Smoke Test
        ↓
RELEASE
```

---

# 90. Final Testing Rule

> **A feature is not considered complete because it works once. It is complete when it works correctly, fails safely, respects permissions, preserves data integrity, survives expected edge cases, and passes regression testing.**
