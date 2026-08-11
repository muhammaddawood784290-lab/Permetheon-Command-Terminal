# PCT — Notification System

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Document Type:** Notification System Specification
**Status:** Active
**Version:** 1.0

---

# 1. Purpose

The PCT Notification System provides users with timely internal notifications about actions and events that require their attention.

Notifications are application-level messages.

They are different from Activity Logs.

```text
Activity Log
    ↓
What happened?

Notification
    ↓
Who needs to know about it?
```

---

# 2. Core Principle

> **Activity logs record events. Notifications communicate relevant events to users.**

An event may create an activity log without creating a notification.

Example:

```text
Developer changes task description
        ↓
Activity Log
        ↓
No Notification
```

Another example:

```text
Developer submits task for review
        ↓
Activity Log
        +
Notification to Reviewer
```

---

# 3. Notification Architecture

```text
User Action
    ↓
Express.js
    ↓
Business Service
    ├──────────────► MySQL
    │                  └── Activity Log
    │
    └──────────────► Notification Service
                         ↓
                       MySQL
                         ↓
                   Notification
                         ↓
                  React Dashboard
```

No external notification API is required for the initial system.

---

# 4. Initial Notification Channel

PCT initially supports:

```text
IN_APP
```

Notifications appear inside the PCT interface.

Initial system does NOT require:

```text
Email
SMS
WhatsApp
Push Notifications
```

These may be added later if required.

---

# 5. Notification Storage

Notifications are stored in MySQL.

Recommended conceptual structure:

```text
notifications
│
├── id
├── user_id
├── type
├── title
├── message
├── entity_type
├── entity_id
├── is_read
├── created_at
└── read_at
```

The exact schema must follow:

```text
DATABASE.md
```

---

# 6. Notification Ownership

Every notification belongs to a specific user.

Example:

```text
notification
    ↓
user_id = 15
```

Only that user should be able to retrieve or modify the notification state.

A user must never be able to access another user's notifications.

---

# 7. Notification Lifecycle

Basic lifecycle:

```text
Created
   ↓
Unread
   ↓
Viewed / Marked Read
```

Optional future state:

```text
Archived
```

Initial implementation only requires:

```text
UNREAD
READ
```

---

# 8. Read State

A notification should contain a read state.

Conceptually:

```text
is_read = false
```

means unread.

```text
is_read = true
```

means read.

Optional timestamp:

```text
read_at
```

records when the notification was marked as read.

---

# 9. Notification Types

Initial notification types should be predictable constants.

Examples:

```text
TASK_ASSIGNED
TASK_REVIEW_REQUESTED
TASK_APPROVED
TASK_REVISION_REQUESTED
TASK_COMMENTED
PROJECT_ASSIGNED
FILE_RELEVANT
SYSTEM_ALERT
```

Only introduce a new notification type when a real business requirement exists.

---

# 10. Task Assignment Notification

When a task is assigned to a developer:

```text
Task Assignment
      ↓
Activity Log
      +
Notification
      ↓
Developer
```

Example:

```text
Title:
New Task Assigned

Message:
You have been assigned a new task.
```

The notification should reference the task.

---

# 11. Review Request Notification

When a developer submits a task for review:

```text
Developer
   ↓
Submit for Review
   ↓
Task Status = REVIEW
   ↓
Activity Log
   +
Notification
   ↓
Reviewer
```

Example:

```text
Title:
Task Ready for Review

Message:
A task has been submitted and is ready for your review.
```

---

# 12. Approval Notification

When a reviewer approves a task:

```text
Reviewer
   ↓
Approve
   ↓
Task = COMPLETED
   ↓
Activity Log
   +
Notification
   ↓
Developer
```

Example:

```text
Title:
Task Approved

Message:
Your task has been approved.
```

---

# 13. Revision Notification

When a reviewer requests changes:

```text
Reviewer
   ↓
Revision Required
   ↓
Activity Log
   +
Notification
   ↓
Developer
```

Example:

```text
Title:
Revision Required

Message:
Changes have been requested for your task.
```

The notification should link the user to the relevant task.

---

# 14. Comment Notification

Comment notifications should be generated only when the comment requires another user's attention.

Example:

```text
Reviewer comments on Developer's task
        ↓
Developer Notification
```

Do not notify the user about their own comments.

---

# 15. Project Notifications

If project-level assignments or major project events are introduced:

```text
Project Assigned
Project Member Added
Project Status Changed
Project Deadline Changed
```

may generate notifications.

These should be implemented only when required by the project workflow.

---

# 16. System Notifications

System notifications may be used for important internal events.

Examples:

```text
SYSTEM_ALERT
SYSTEM_MAINTENANCE
SECURITY_ALERT
```

System notifications should be rare and meaningful.

Do not use them as generic messages for normal application events.

---

# 17. Notification Creation

Notifications should be created by backend business logic.

Preferred:

```text
Task Service
   ↓
Update Task
   ↓
Create Activity
   ↓
Create Notification
```

Not:

```text
React
   ↓
"Create notification"
   ↓
Backend
```

The frontend should never be the authoritative source for notifications.

---

# 18. Notification Service

Recommended backend service:

```text
notificationService.js
```

Responsibilities:

```text
Create notification
Get user notifications
Get unread count
Mark notification as read
Mark all as read
Delete/archive notification if supported
```

---

# 19. Recommended Backend Structure

```text
server/
├── routes/
│   └── notificationRoutes.js
│
├── controllers/
│   └── notificationController.js
│
├── services/
│   └── notificationService.js
│
└── middleware/
    └── authentication.js
```

Actual structure should remain consistent with the existing project architecture.

---

# 20. Notification API

Initial API:

```text
GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

Additional endpoints may be introduced later.

All endpoints must follow:

```text
API.md
```

---

# 21. Get Notifications

```text
GET /api/notifications
```

Returns notifications belonging to the authenticated user.

The backend must derive the user from the authenticated session/token.

Do not accept an arbitrary `user_id` from the frontend as the authority.

---

# 22. Unread Count

```text
GET /api/notifications/unread-count
```

Returns the number of unread notifications belonging to the authenticated user.

Example:

```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

# 23. Mark Notification as Read

```text
PATCH /api/notifications/:id/read
```

The backend must verify:

```text
notification.user_id === authenticated_user.id
```

before modifying it.

A user cannot mark another user's notification as read.

---

# 24. Mark All as Read

```text
PATCH /api/notifications/read-all
```

This operation should affect only notifications belonging to the authenticated user.

Incorrect:

```text
UPDATE notifications
SET is_read = true;
```

Correct concept:

```text
UPDATE notifications
SET is_read = true
WHERE user_id = authenticated_user
AND is_read = false;
```

---

# 25. Notification Ordering

Notifications should normally be displayed newest first.

Recommended:

```text
created_at DESC
```

Example:

```text
Newest
↓
Today
↓
Yesterday
↓
Older
```

---

# 26. Pagination

The notification list should support pagination when required.

Example:

```text
GET /api/notifications?page=1&limit=20
```

The backend should enforce reasonable limits.

Do not allow a client to request thousands of records unnecessarily.

---

# 27. Notification Retention

Initial policy:

```text
Notifications remain stored unless explicitly removed/archived.
```

A future retention policy may be introduced if database growth becomes significant.

Do not automatically delete notifications without a documented policy.

---

# 28. Notification UI

The main notification interface should include:

```text
Notification Bell
Unread Badge
Notification List
Read/Unread State
Notification Timestamp
Navigation Target
```

Recommended placement:

```text
Top Navigation
        ↓
Notification Bell
```

---

# 29. Notification Badge

Unread notifications should be represented by a badge.

Example:

```text
🔔 5
```

If there are no unread notifications:

```text
🔔
```

Do not display a fake count.

---

# 30. Notification Dropdown

The notification dropdown may show:

```text
Latest notifications
Unread indicator
Timestamp
Short message
Click action
View All
```

Example:

```text
┌──────────────────────────────┐
│ Notifications          3     │
├──────────────────────────────┤
│ ● Task Ready for Review      │
│   2 minutes ago              │
│                              │
│ ● Revision Required          │
│   1 hour ago                 │
│                              │
│ ○ Task Approved              │
│   Yesterday                  │
├──────────────────────────────┤
│ View All Notifications        │
└──────────────────────────────┘
```

---

# 31. Read/Unread UI

Unread notifications should be visually distinguishable.

Possible indicators:

```text
Unread:
Bold title
Unread dot
Different background

Read:
Normal text
No unread indicator
```

The exact visual implementation follows the PCT design system.

---

# 32. Clicking a Notification

If a notification references an entity:

```text
Notification
   ↓
entity_type
entity_id
   ↓
Frontend Route
   ↓
Relevant Page
```

Example:

```text
TASK
102
```

may navigate to:

```text
/tasks/102
```

The actual route must follow the frontend routing structure.

---

# 33. Notification Entity References

Notifications may reference:

```text
TASK
PROJECT
COMMENT
FILE
SYSTEM
```

Example:

```text
entity_type = TASK
entity_id = 102
```

This allows the frontend to determine where the notification should navigate.

---

# 34. Invalid Entity Reference

If a referenced entity no longer exists:

```text
Notification
   ↓
Task deleted
```

The notification should remain safely viewable if appropriate.

Example:

```text
Task is no longer available.
```

Do not allow the UI to crash because a referenced entity disappeared.

---

# 35. Notification Message Design

Messages should be:

```text
Short
Clear
Actionable
Specific
```

Avoid:

```text
Something happened.
An event occurred.
You have an update.
```

Prefer:

```text
Your task "Homepage Redesign" has been approved.
```

---

# 36. Notification Duplication

The backend should avoid accidental duplicate notifications.

Example:

A single task submission should not create five identical:

```text
TASK_REVIEW_REQUESTED
```

notifications.

The relevant service should ensure the operation is idempotent where necessary.

---

# 37. Self-Notifications

Users should generally not receive notifications for actions they performed themselves.

Example:

```text
Developer submits task
```

Do not notify the same developer:

```text
"You submitted a task for review."
```

unless a specific UX requirement calls for it.

Notify the person who needs to act.

---

# 38. Notification Recipients

Recipients should be determined by backend business rules.

Example:

```text
Task assigned
    ↓
Assigned Developer

Task submitted for review
    ↓
Reviewer / Team Lead

Task approved
    ↓
Developer

Revision requested
    ↓
Developer
```

Never allow the frontend to freely choose notification recipients for authoritative workflow events.

---

# 39. Multiple Recipients

Some events may require multiple recipients.

Example:

```text
Project status changed
        ↓
Project members
```

The backend should create one notification record per recipient unless a different architecture is intentionally implemented.

---

# 40. Notification Security

A notification must never reveal information the user is not authorized to access.

Example:

If a developer cannot access Project #20, they should not receive:

```text
Project #20 has been updated.
```

unless the notification itself is intentionally designed to reveal that information.

---

# 41. Notification Data Exposure

Do not include sensitive data unnecessarily.

Avoid storing:

```text
Passwords
Tokens
Private credentials
Internal secrets
Sensitive database information
```

inside notification titles/messages.

---

# 42. Notification vs Activity Log

## Activity Log

Purpose:

```text
Audit
History
Traceability
```

Example:

```text
Dawood changed Task #102 status from IN_PROGRESS to REVIEW.
```

## Notification

Purpose:

```text
Attention
Action
Awareness
```

Example:

```text
Task #102 is ready for your review.
```

A single event may create both.

---

# 43. Notification and Activity Example

```text
Developer submits task
        │
        ├── Activity Log
        │     "Task submitted for review"
        │
        └── Notification
              "Task ready for review"
                    ↓
                 Reviewer
```

This is the preferred pattern.

---

# 44. Notification Failure

A notification failure should not necessarily invalidate the primary business operation.

Example:

```text
Task successfully updated
        ↓
Notification creation fails
```

The task update should not automatically be rolled back unless the business requirement explicitly requires notification creation to be atomic.

The failure should be logged.

---

# 45. Database Transactions

If a business operation requires notification creation to be part of an atomic database transaction, use a transaction.

Example:

```text
Task Update
+
Activity
+
Notification
```

can be committed together when required.

The implementation should follow the transaction rules in `DATABASE.md`.

---

# 46. Frontend Notification Service

Recommended:

```text
client/src/services/notificationService.js
```

Responsibilities:

```text
getNotifications()
getUnreadCount()
markAsRead(id)
markAllAsRead()
```

The service should communicate with Express APIs.

---

# 47. Frontend Notification Components

Recommended:

```text
client/src/components/notifications/
│
├── NotificationBell.jsx
├── NotificationDropdown.jsx
├── NotificationItem.jsx
├── NotificationList.jsx
└── NotificationBadge.jsx
```

Actual names may be adjusted to match project conventions.

---

# 48. Notification Page

Recommended route:

```text
/notifications
```

The page should support:

```text
All Notifications
Unread Notifications
Read State
Timestamp
Navigation
```

Filtering may be added if required.

---

# 49. Polling

Initial implementation may use periodic polling if real-time updates are required.

Example:

```text
Every 30–60 seconds
       ↓
GET unread count
```

Do not implement aggressive polling.

Avoid requests every second.

---

# 50. Real-Time Notifications

WebSockets/SSE are NOT required for the initial implementation.

Do not add:

```text
Socket.io
WebSockets
SSE
```

unless a real-time requirement is established.

The initial notification system should remain simple.

---

# 51. Notification Refresh

After a user performs an action that may generate a notification, the frontend may refresh notification state.

Example:

```text
Task action
   ↓
API success
   ↓
Refresh notification count
```

Avoid unnecessary full-page reloads.

---

# 52. Notification Loading State

The UI should handle:

```text
Loading
Loaded
Empty
Error
```

Example empty state:

```text
You're all caught up.
```

---

# 53. Notification Error State

If notifications cannot be loaded:

```text
Unable to load notifications.
Please try again.
```

The rest of the dashboard should remain functional where possible.

---

# 54. Notification Count Accuracy

Unread count must come from the backend/database.

Do not calculate the authoritative count only from currently loaded frontend notifications.

Example:

```text
Database:
37 unread

Frontend dropdown:
20 loaded

Badge:
37
```

Pagination must not cause the badge to become inaccurate.

---

# 55. Notification Performance

Notification queries should:

```text
Use indexed user_id
Filter efficiently
Order by created_at
Use pagination
Limit returned records
```

Recommended indexes should be defined in:

```text
DATABASE.md
```

---

# 56. Notification Query Security

Every notification query must be scoped to the authenticated user.

Never implement:

```text
SELECT * FROM notifications WHERE id = ?
```

without subsequently verifying ownership.

Preferred concept:

```text
SELECT *
FROM notifications
WHERE id = ?
AND user_id = ?
```

---

# 57. Notification API Security Checklist

```text
[ ] Authentication required
[ ] User identity comes from authenticated session
[ ] Notifications scoped to current user
[ ] Read operation checks ownership
[ ] Mark-all operation scoped to current user
[ ] Entity references do not bypass authorization
[ ] Sensitive information not exposed
[ ] Pagination limits enforced
```

---

# 58. Development Checklist

Before marking the notification system complete:

```text
[ ] Notification table exists
[ ] Notification service exists
[ ] Notification controller exists
[ ] Notification routes exist
[ ] Authentication enforced
[ ] User ownership enforced
[ ] Notification creation works
[ ] Unread count works
[ ] Mark as read works
[ ] Mark all as read works
[ ] Notification dropdown works
[ ] Notification page works
[ ] Empty state works
[ ] Error state works
[ ] Relevant task events create notifications
[ ] Duplicate notifications are prevented
[ ] Activity logs remain separate
[ ] API documentation updated
[ ] Database documentation updated
```

---

# 59. Initial Event Matrix

| Event                     | Activity Log | Notification | Recipient     |
| ------------------------- | ------------ | ------------ | ------------- |
| Task Created              | Yes          | Usually No   | —             |
| Task Assigned             | Yes          | Yes          | Developer     |
| Task Started              | Yes          | Usually No   | —             |
| Task Submitted for Review | Yes          | Yes          | Reviewer      |
| Task Approved             | Yes          | Yes          | Developer     |
| Revision Requested        | Yes          | Yes          | Developer     |
| Comment Added             | Yes          | Conditional  | Relevant User |
| File Uploaded             | Yes          | Conditional  | Relevant User |
| Project Assigned          | Yes          | Yes          | Assigned User |
| Login                     | Yes          | No           | —             |
| Logout                    | Yes          | No           | —             |
| System Alert              | Yes          | Yes          | Target Users  |

---

# 60. Future Notification Channels

Possible future channels:

```text
Email
SMS
WhatsApp
Browser Push
Mobile Push
```

These are NOT part of the initial PCT notification implementation.

If introduced, they should be implemented as separate notification channels rather than tightly coupling external providers to core business logic.

---

# 61. Future Notification Preferences

A future version may allow users to configure:

```text
Task notifications
Project notifications
Comment notifications
Review notifications
System notifications
```

Possible preferences:

```text
In-App: ON/OFF
Email: ON/OFF
Push: ON/OFF
```

This is not required for V1.

---

# 62. Final Notification Principle

> **PCT notifications exist to tell the right user about something that requires awareness or action. They are generated by backend business logic, stored in MySQL, displayed through React, and always protected by user-level authorization.**

The notification system must remain simple, reliable, secure, and separate from the audit-focused Activity Log system.
