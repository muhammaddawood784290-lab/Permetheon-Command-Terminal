# PCT — Review System

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Domain:** `pct.permetheon.com`
**Document Type:** Review & Approval System Specification
**Status:** Active Development
**Version:** 1.0

---

# 1. Purpose

The Review System manages the internal review process for development work inside PCT.

Its purpose is to provide a structured workflow where completed development work can be:

```text id="r1v7c3"
Submitted
   ↓
Reviewed
   ↓
Approved
```

or:

```text id="x4m9q2"
Submitted
   ↓
Reviewed
   ↓
Revision Required
   ↓
Developer Updates Work
   ↓
Resubmitted
```

The Review System prevents review work from being handled through scattered messages or informal communication.

---

# 2. Core Principle

> **A task is not considered approved merely because a developer marks it as finished.**

Development completion and review approval are separate states.

```text id="m8k2p5"
Developer Completion
        ↓
Review Submission
        ↓
Reviewer Decision
        ↓
Approved / Revision Required
```

---

# 3. Review Scope

The Review System manages:

```text id="a5x8n1"
Review Submission
Reviewer Assignment
Review Status
Review Comments
Review Decisions
Revision Requests
Review History
Approval
Activity Logging
Notifications
```

It does NOT manage the complete task lifecycle.

Task lifecycle remains part of the Task System.

---

# 4. Review Relationship

A review belongs to a task.

```text id="q3v7m9"
Project
   │
   └── Task
        │
        └── Review
```

A task may have multiple review attempts.

Example:

```text id="j6p2c8"
Task #101
   │
   ├── Review #1 → Revision Required
   │
   ├── Review #2 → Revision Required
   │
   └── Review #3 → Approved
```

Historical review records should remain available.

---

# 5. Review Lifecycle

Standard lifecycle:

```text id="s8n4x1"
NOT_SUBMITTED
      ↓
SUBMITTED
      ↓
IN_REVIEW
      ↓
┌───────────────┐
│               │
▼               ▼
APPROVED   REVISION_REQUIRED
               │
               ▼
            RESUBMITTED
               │
               ▼
            IN_REVIEW
```

---

# 6. Review Statuses

Initial review statuses:

```text id="p5q8m2"
SUBMITTED
IN_REVIEW
APPROVED
REVISION_REQUIRED
```

Optional future status:

```text id="c7x3v9"
CANCELLED
```

Do not introduce additional statuses unless the workflow requires them.

---

# 7. Review Submission

A developer submits a completed task for review.

Conceptual workflow:

```text id="n2m6k4"
Developer
   ↓
Complete Work
   ↓
Submit for Review
   ↓
Task enters REVIEW
   ↓
Review Record Created
   ↓
Reviewer Notified
```

---

# 8. Submission Requirements

Before submission, the system should validate the task.

Possible requirements:

```text id="r9v3p1"
Task exists
User has permission
Task is assigned correctly
Task is eligible for review
Required information exists
```

The exact requirements depend on the Task System.

---

# 9. Reviewer Assignment

A review should have a reviewer.

Possible sources:

```text id="w4k7s2"
Assigned Reviewer
Project Lead
Team Lead
Admin
```

The reviewer must have permission to review the task.

---

# 10. Reviewer Selection

The system may support:

```text id="f8m1x5"
Automatic Reviewer
Manual Reviewer
Project Lead Review
```

For V1, the simplest reliable approach is:

```text id="d6q3n8"
Explicit Reviewer Assignment
```

Avoid complex automatic reviewer routing unless required.

---

# 11. Review Record

A review record should conceptually contain:

```text id="z2p7c4"
id
task_id
reviewer_id
submission_id / attempt
status
review_comment
created_at
reviewed_at
```

Additional fields may be introduced when required.

---

# 12. Review Attempt

Every time a task is submitted for review, a review attempt may be created.

Example:

```text id="q8v4m1"
Attempt #1
Revision Required

Attempt #2
Revision Required

Attempt #3
Approved
```

This preserves the review history.

---

# 13. Review Comments

Reviewers should be able to provide feedback.

Example:

```text id="m5x9s2"
"Mobile navigation breaks below 768px.
Please fix the responsive menu and resubmit."
```

Review comments should be associated with the review attempt.

---

# 14. Revision Request

If work does not meet requirements, the reviewer selects:

```text id="c1n7p4"
REVISION_REQUIRED
```

A revision request should include useful feedback.

Avoid vague comments such as:

```text id="j4r8x2"
"Fix this."
"Not good."
"Redo."
```

Feedback should identify what needs to change.

---

# 15. Revision Workflow

```text id="p7m2q8"
Review
   ↓
Revision Required
   ↓
Developer Notified
   ↓
Developer Updates Task
   ↓
Task Resubmitted
   ↓
New Review Attempt
```

The original review must remain in history.

---

# 16. Approval

When the reviewer confirms that the work meets requirements:

```text id="x3v8n5"
Review
   ↓
APPROVED
```

The task may then transition to:

```text id="q9m4c1"
COMPLETED
```

The exact task transition must follow the Task System rules.

---

# 17. Approval Authority

Only authorized reviewers may approve work.

The frontend must not determine whether a user can approve a task.

Correct:

```text id="w6k2p7"
React
   ↓
Express
   ↓
Authorization
   ↓
Approve Review
```

---

# 18. Self-Approval

By default, a developer should not approve their own work.

Recommended rule:

```text id="r5x8m3"
Task Developer ≠ Reviewer
```

Exceptions may be introduced for specific administrative workflows.

---

# 19. Review Permissions

Typical permissions:

### Admin

```text id="n1q7v4"
View Reviews
Assign Reviewers
Review
Approve
Request Revision
```

### Team Lead

```text id="c8m2x6"
View Reviews
Review Assigned Work
Approve
Request Revision
```

### Developer

```text id="p4v9s1"
Submit Work
View Own Review
Read Review Feedback
Resubmit Work
```

Developers should not normally approve their own work.

---

# 20. Review Visibility

A review should generally be visible to:

```text id="j7x3m8"
Task Developer
Assigned Reviewer
Project Lead
Authorized Admins
```

Visibility must follow backend authorization.

---

# 21. Review Notifications

Important review events may trigger notifications.

### Submission

```text id="w2n6q5"
Developer submits task
        ↓
Reviewer notification
```

### Approval

```text id="m8c4v1"
Review approved
        ↓
Developer notification
```

### Revision

```text id="s5p9x2"
Revision requested
        ↓
Developer notification
```

Notification behavior is defined in:

```text id="e7k3m4"
NOTIFICATION_SYSTEM.md
```

---

# 22. Review Activity

Important review actions must create activity records.

Examples:

```text id="q1v8n5"
Task submitted for review
Review started
Review approved
Revision requested
Task resubmitted
Reviewer changed
```

Detailed behavior is defined in:

```text id="z4m7c2"
ACTIVITY_LOG.md
```

---

# 23. Review History

Review history must not be overwritten.

Example:

```text id="f6x2p9"
Task #101

Review #1
Status: REVISION_REQUIRED
Reviewer: Team Lead
Date: Aug 10

Review #2
Status: APPROVED
Reviewer: Team Lead
Date: Aug 11
```

This provides an audit trail of the development review process.

---

# 24. Review Decision

A reviewer should have clear actions:

```text id="b3q7m1"
[ Approve ]
[ Request Revision ]
```

Do not make the decision ambiguous.

---

# 25. Revision Comment Requirement

When selecting:

```text id="c9v4x8"
Request Revision
```

the reviewer should provide a meaningful reason.

The system should reject an empty revision reason if review feedback is required.

Example:

```text id="y2m8p5"
Revision reason is required.
```

---

# 26. Approval Comment

Approval comments may be optional.

Example:

```text id="s7n3q1"
"Approved. Responsive layout and form validation verified."
```

This can be useful for historical context.

---

# 27. Review Timestamp

Important review actions should store timestamps.

Example:

```text id="k4x9m2"
submitted_at
started_at
reviewed_at
```

Only store fields that are actually required by the implementation.

---

# 28. Review Turnaround

If timestamps support it, the system may calculate:

```text id="p8c2v7"
Review Turnaround =
reviewed_at - submitted_at
```

Example:

```text id="n5m1x4"
Submitted: 14:00
Reviewed: 16:30

Turnaround: 2h 30m
```

This can be used by the Reports System.

---

# 29. Review Queue

Reviewers should have a review queue.

Example:

```text id="x7q3m8"
My Review Queue

┌────────────────────────────────────┐
│ Task #101     Nova Nail Studio    │
│ Submitted 2h ago                  │
├────────────────────────────────────┤
│ Task #108     Permetheon Website  │
│ Submitted 5h ago                  │
└────────────────────────────────────┘
```

---

# 30. Review Queue Sorting

Default sorting should prioritize older pending reviews.

Example:

```text id="r2v8n5"
Oldest Submitted
        ↓
Newest Submitted
```

This helps prevent reviews from being forgotten.

---

# 31. Review Filters

Review queues may support:

```text id="m4x7c1"
Project
Developer
Status
Priority
Date
```

---

# 32. Review Search

Reviewers may search by:

```text id="q8n2p5"
Task Name
Task ID
Project Name
Developer
```

Search should be handled efficiently by the backend.

---

# 33. Review Detail Page

Recommended route:

```text id="v5m9x3"
/tasks/:taskId/review
```

or review-specific route:

```text id="j2c7q8"
/reviews/:id
```

The final route should follow the existing routing architecture.

---

# 34. Review Detail UI

Recommended layout:

```text id="f4x8n2"
Review
│
├── Task Information
├── Developer
├── Project
├── Submitted Work
├── Files
├── Comments
├── Review Feedback
├── Review History
└── Decision
```

---

# 35. Submitted Work

The reviewer should be able to inspect the relevant work before deciding.

Depending on the task, this may include:

```text id="w7p3m9"
Task Description
Files
Screenshots
Links
Comments
Implementation Notes
```

The system should not require all of these for every task.

---

# 36. Review Files

Reviewers should have access to files relevant to the submitted task.

File access must respect:

```text id="c5q8v1"
Project Permissions
Task Permissions
File Permissions
```

Detailed file rules:

```text id="a9m2x7"
FILE_SYSTEM.md
```

---

# 37. Review Comments vs Task Comments

These should remain conceptually separate.

### Task Comment

General task discussion.

### Review Comment

Feedback specifically related to the review decision.

Example:

```text id="r8n4c2"
Task Comment:
"Client sent another logo."

Review Comment:
"Please replace the old logo in the header."
```

---

# 38. Review State and Task State

The Review System and Task System must remain synchronized.

Example:

```text id="p6m1x9"
Developer submits
        ↓
Task = REVIEW
Review = SUBMITTED
```

Reviewer starts:

```text id="q3v7k5"
Task = REVIEW
Review = IN_REVIEW
```

Approval:

```text id="n8x2c4"
Review = APPROVED
Task = COMPLETED
```

Revision:

```text id="m5r9p1"
Review = REVISION_REQUIRED
Task = REVISION_REQUIRED
```

Exact task transitions must follow the Task System specification.

---

# 39. Review State Authority

The backend controls review state.

Frontend may request:

```text id="w4c8n2"
Approve
Request Revision
Start Review
```

But Express.js must validate:

```text id="x7m3q5"
Current Review State
User Permission
Task State
Reviewer Assignment
```

before changing anything.

---

# 40. Review API

Initial endpoints may include:

```text id="k2v8s4"
GET    /api/reviews
GET    /api/reviews/:id
POST   /api/reviews
PATCH  /api/reviews/:id/start
PATCH  /api/reviews/:id/approve
PATCH  /api/reviews/:id/revision
POST   /api/reviews/:id/comments
```

Exact endpoint contracts belong in:

```text id="f9x3m7"
API.md
```

---

# 41. Submit for Review API

Conceptual endpoint:

```text id="n4q8c1"
POST /api/tasks/:taskId/reviews
```

The backend should:

```text id="j7m2v5"
Validate Task
   ↓
Validate User
   ↓
Validate Task State
   ↓
Create Review
   ↓
Update Task State
   ↓
Create Activity
   ↓
Create Notification
```

Only applicable steps should execute.

---

# 42. Approve Review API

Conceptual endpoint:

```text id="p3x8m6"
PATCH /api/reviews/:id/approve
```

Backend should:

```text id="r1v7q4"
Authenticate
   ↓
Authorize Reviewer
   ↓
Validate Review State
   ↓
Approve Review
   ↓
Update Task State
   ↓
Create Activity
   ↓
Notify Developer
```

These operations should be handled safely as one logical transaction where appropriate.

---

# 43. Revision API

Conceptual endpoint:

```text id="c6m2x9"
PATCH /api/reviews/:id/revision
```

Request may contain:

```json id="v8q4p1"
{
  "comment": "Fix responsive navigation on mobile screens."
}
```

Backend should:

```text id="j5n8c3"
Validate Reviewer
   ↓
Validate Review State
   ↓
Store Decision
   ↓
Store Feedback
   ↓
Update Task
   ↓
Create Activity
   ↓
Notify Developer
```

---

# 44. Review Database Relationships

Conceptual structure:

```text id="x3m7q8"
users
  │
  ├── reviews
  │
  └── review_comments

projects
  │
  └── tasks
        │
        └── reviews
```

Review records must reference valid tasks and users.

---

# 45. Database Integrity

The database should prevent invalid review relationships.

Examples:

```text id="n9c4v2"
Review references nonexistent task
Review references nonexistent reviewer
Review comment references nonexistent review
```

Foreign keys and backend validation should be used.

---

# 46. Review Concurrency

The system should prevent conflicting review decisions.

Example:

```text id="q7m3x5"
Reviewer A → Approves
Reviewer B → Requests Revision
```

If multiple reviewers are ever supported, the business rule must explicitly define how conflicting decisions are handled.

For V1, one active reviewer per review is recommended.

---

# 47. Multiple Reviewers

V1 should prefer:

```text id="r4c8n1"
One Active Review
One Assigned Reviewer
```

Multiple reviewer workflows should only be introduced if a real business requirement exists.

---

# 48. Re-Review

After revision:

```text id="m2v7x4"
Review #1
    ↓
Revision Required
    ↓
Developer Fixes
    ↓
Review #2
```

Do not overwrite Review #1.

---

# 49. Review History UI

The task/review page should show historical attempts.

Example:

```text id="f8q3m6"
Review History

✓ Review #3 — Approved
  Team Lead — Aug 11

↻ Review #2 — Revision Required
  Team Lead — Aug 10

↻ Review #1 — Revision Required
  Team Lead — Aug 09
```

---

# 50. Review Notifications

Minimum V1 notifications:

```text id="x5n8c2"
Task Submitted for Review
Review Approved
Revision Required
```

Optional:

```text id="q1m7v4"
Reviewer Assigned
Review Reassigned
```

---

# 51. Review Activity Examples

Activity entries:

```text id="c8p2x5"
Developer submitted Task #101 for review.

Team Lead started reviewing Task #101.

Team Lead approved Task #101.

Team Lead requested revision on Task #108.
```

Activity records should identify:

```text id="v6m9q3"
Actor
Action
Target
Timestamp
```

---

# 52. Error Handling

Possible review errors:

```text id="j4x8m1"
Review not found
Task not found
Unauthorized
Forbidden
Task not eligible for review
Review already completed
Reviewer not assigned
Revision comment required
Invalid review state
```

API responses must follow:

```text id="n7q2c5"
API.md
```

---

# 53. Review UI States

The frontend must support:

```text id="m3v8x6"
Loading
Empty
Submitted
In Review
Approved
Revision Required
Error
Unauthorized
```

---

# 54. Review Empty State

If no reviews are waiting:

```text id="p5q1n7"
No tasks are currently waiting for review.
```

---

# 55. Review Loading State

Example:

```text id="x8m4c2"
Loading review...
```

Skeleton UI may be used.

---

# 56. Review Decision Confirmation

Approval should optionally use confirmation:

```text id="r3v7q9"
Approve this task?

This will mark the review as approved and may complete the task.
```

Revision should similarly require confirmation when appropriate.

---

# 57. Prevent Duplicate Actions

After approval:

```text id="c2m8x4"
Approve
```

must no longer remain an active action for the same review.

The backend must also reject duplicate approval requests.

Frontend UI alone is not sufficient protection.

---

# 58. Review Security

The Review System must enforce:

```text id="q7n3v5"
Authentication
Authorization
Reviewer Validation
Task Ownership Rules
Project Access
Input Validation
SQL Parameterization
```

---

# 59. No Frontend Trust

Never trust frontend values such as:

```text id="m4x9p2"
reviewer_id
user_id
role
task_status
review_status
```

The backend must derive or validate these values.

---

# 60. Review Performance

Review queries should use indexed relationships.

Recommended indexes may include:

```text id="f1c7m8"
task_id
reviewer_id
status
created_at
```

Exact indexes must be determined by the final database schema and query patterns.

---

# 61. Review Reporting

The Reports System may use review data for:

```text id="v8q2n5"
Review Queue
Approved Reviews
Revision Count
Review Turnaround
Pending Reviews
```

Detailed reporting behavior:

```text id="j5m3x7"
REPORTS.md
```

---

# 62. Review Workflow Example

Complete example:

```text id="s4c8m1"
Developer completes Task #101
        ↓
Submit for Review
        ↓
Review #1 created
        ↓
Reviewer notified
        ↓
Reviewer starts review
        ↓
Reviewer finds issue
        ↓
Revision Required
        ↓
Developer notified
        ↓
Developer fixes issue
        ↓
Submit again
        ↓
Review #2 created
        ↓
Reviewer reviews
        ↓
Approved
        ↓
Task Completed
```

---

# 63. Review System Testing

### Submission

```text id="x2m7q4"
[ ] Developer can submit eligible task
[ ] Ineligible task cannot be submitted
[ ] Review record is created
[ ] Task state updates correctly
[ ] Activity is created
[ ] Reviewer notification is created
```

### Approval

```text id="p8v3n6"
[ ] Authorized reviewer can approve
[ ] Unauthorized user cannot approve
[ ] Review becomes APPROVED
[ ] Task state updates correctly
[ ] Activity is created
[ ] Developer notification is created
```

### Revision

```text id="c5q9m2"
[ ] Authorized reviewer can request revision
[ ] Revision reason is required
[ ] Review becomes REVISION_REQUIRED
[ ] Task state updates correctly
[ ] Activity is created
[ ] Developer notification is created
```

### Re-Review

```text id="m7x1v8"
[ ] Developer can resubmit
[ ] New review attempt is created
[ ] Previous review remains unchanged
[ ] Review history remains available
```

---

# 64. Security Testing

```text id="q4n8c2"
[ ] Developer cannot approve own task
[ ] Unauthorized users cannot access reviews
[ ] Unauthorized users cannot modify reviews
[ ] Reviewer assignment is validated
[ ] Invalid review IDs are handled safely
[ ] Duplicate decisions are blocked
[ ] Revision comments are validated
[ ] File access respects permissions
```

---

# 65. Definition of Done

The Review System is complete when:

```text id="w3m7p9"
[ ] Task can be submitted for review
[ ] Reviewer can access review
[ ] Reviewer can start review
[ ] Reviewer can approve
[ ] Reviewer can request revision
[ ] Revision reason is stored
[ ] Developer can resubmit
[ ] Review history is preserved
[ ] Task status synchronizes correctly
[ ] Activity logs are created
[ ] Notifications are created
[ ] Permissions are enforced
[ ] Error states work
[ ] Loading states work
[ ] Database relationships work
[ ] API is documented
[ ] Production build succeeds
```

---

# 66. Final Review Principle

> **The Review System creates a clear separation between "developer says the work is done" and "authorized reviewer confirms the work is approved."**

The complete workflow is:

```text id="n5x2c8"
WORK
 ↓
SUBMIT
 ↓
REVIEW
 ↓
┌───────────────┐
│               │
▼               ▼
APPROVED    REVISION
│               │
▼               │
DONE ◄──────────┘
```

Every review decision must be:

```text id="q8m4v1"
Authorized
Traceable
Persistent
Understandable
```

The system should preserve the complete review history so Permetheon can always determine **who reviewed the work, when it was reviewed, what decision was made, and what changes were requested.**
