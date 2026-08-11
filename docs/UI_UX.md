# PCT — UI/UX System

**Project:** Permetheon Command Terminal
**Short Name:** PCT
**Production Domain:** `pct.permetheon.com`
**Stack:** React 18+, Tailwind CSS, Express.js, MySQL
**Document Type:** UI/UX Specification
**Status:** Active Development
**Version:** 1.0

---

# 1. Purpose

This document defines the visual design, interaction patterns, layout rules, component behavior, accessibility standards, and overall user experience for PCT.

PCT is an internal developer command and work-management platform.

The interface must prioritize:

```text
Clarity
Speed
Productivity
Consistency
Low Cognitive Load
Professional Appearance
Responsive Design
```

The UI must not feel like a generic public SaaS landing page.

It should feel like an internal professional engineering platform.

---

# 2. Core UX Philosophy

PCT should follow:

```text
Simple
Fast
Functional
Information-Dense
Consistent
Predictable
```

Avoid:

```text
Unnecessary Animations
Excessive Gradients
Huge Empty Spaces
Decorative Components
Confusing Navigation
Overly Complex Modals
Unnecessary Popups
```

The interface should help developers complete work rather than distract them.

---

# 3. Design Personality

The visual personality should communicate:

```text
Professional
Technical
Modern
Reliable
Internal Tool
Developer-Focused
```

The design should feel similar in usability principles to modern developer tools and project-management applications, without copying another product's interface.

---

# 4. Application Layout

Primary layout:

```text
┌─────────────────────────────────────────────┐
│                 TOP BAR                     │
├──────────────┬──────────────────────────────┤
│              │                              │
│   SIDEBAR    │         MAIN CONTENT         │
│              │                              │
│              │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

Desktop:

```text
Sidebar
+
Top Navigation
+
Main Content
```

Mobile:

```text
Top Bar
+
Content
+
Mobile Navigation / Drawer
```

---

# 5. Sidebar

The sidebar is the primary navigation system.

Recommended navigation:

```text
Dashboard

Projects
Tasks
Reviews

Notifications

Reports

Activity

Settings
```

Items should only appear when the current user has access.

---

# 6. Sidebar Behavior

The sidebar should support:

```text
Expanded
Collapsed
Mobile Drawer
```

Desktop users may collapse the sidebar to increase workspace area.

Collapsed mode should still provide recognizable icons.

---

# 7. Sidebar Active State

The current page must be visually identifiable.

Example:

```text
Dashboard
Projects
Tasks       ← Active
Reviews
```

The active state should use:

```text
Background
Text Weight
Icon Treatment
Optional Accent
```

Do not rely only on color to communicate active state.

---

# 8. Top Bar

The top bar may contain:

```text
Page Title
Breadcrumbs
Search
Notifications
User Profile
```

Depending on the page, not every element needs to be displayed.

---

# 9. User Menu

User menu may contain:

```text
Profile
Account Settings
Preferences
Logout
```

Role information may also be displayed.

Example:

```text
Dawood
Administrator
```

---

# 10. Main Content

Main content should have:

```text
Consistent Width
Consistent Padding
Readable Spacing
Clear Hierarchy
```

Avoid excessive maximum-width restrictions on data-heavy screens.

Developer dashboards should use available horizontal space efficiently.

---

# 11. Page Structure

Recommended page structure:

```text
Page Header
    ↓
Primary Actions / Filters
    ↓
Main Content
    ↓
Secondary Information
```

Example:

```text
Tasks
Manage development work

[+ Create Task]

[Search] [Status] [Priority] [Developer]

Task Table
```

---

# 12. Page Headers

Every major page should have a clear heading.

Example:

```text
Tasks
Manage and track development work.
```

Primary actions should normally appear near the page heading.

---

# 13. Breadcrumbs

Breadcrumbs may be used for nested pages.

Example:

```text
Projects / Permetheon Website / Tasks / #1042
```

Do not use breadcrumbs where they add no value.

---

# 14. Typography

Typography should prioritize readability.

Recommended hierarchy:

```text
Page Title
Section Heading
Card Heading
Body
Secondary Text
Caption
```

Avoid using too many font sizes.

---

# 15. Font Weight

Use weight intentionally:

```text
Regular
Medium
Semibold
Bold
```

Avoid excessive bold text.

Primary information should be visually stronger than metadata.

---

# 16. Text Colors

Use clear hierarchy:

```text
Primary Text
Secondary Text
Muted Text
Disabled Text
Error Text
Success Text
Warning Text
```

Text should remain readable against its background.

---

# 17. Color System

The application should use a controlled design palette.

Core categories:

```text
Background
Surface
Border
Primary
Secondary
Success
Warning
Danger
Info
Text
Muted
```

Do not introduce random colors for individual components.

---

# 18. Status Colors

Task statuses should have consistent visual meaning.

Recommended semantic mapping:

```text
BACKLOG
Neutral

TODO
Info

IN_PROGRESS
Primary

IN_REVIEW
Warning / Accent

REVISION_REQUIRED
Danger / Warning

COMPLETED
Success

BLOCKED
Danger

CANCELLED
Muted
```

The exact visual color values should be defined centrally.

---

# 19. Priority Colors

Recommended:

```text
LOW
Neutral

MEDIUM
Info

HIGH
Warning

URGENT
Danger
```

Priority must never rely only on color.

Use:

```text
Text
Icon
Badge
```

where appropriate.

---

# 20. Dark Mode

If dark mode is implemented, all components must support it consistently.

Do not implement dark mode by simply reversing colors.

Verify:

```text
Background
Cards
Borders
Text
Inputs
Tables
Modals
Dropdowns
Alerts
Charts
```

---

# 21. Cards

Cards should be used for grouped information.

Good use cases:

```text
Dashboard Metrics
Task Summary
Project Summary
Developer Statistics
Review Summary
```

Avoid wrapping every piece of information inside a card.

---

# 22. Cards Design

Cards should have:

```text
Clear Heading
Useful Content
Consistent Padding
Subtle Border
Consistent Radius
```

Avoid excessive shadows.

---

# 23. Buttons

Buttons should clearly communicate action.

Primary examples:

```text
Create Task
Save Changes
Submit Review
Assign Task
```

Secondary:

```text
Cancel
Back
Filter
Reset
```

Danger:

```text
Delete
Cancel Project
Remove
```

---

# 24. Button Hierarchy

A page should normally have one visually dominant primary action.

Example:

```text
[Create Task] [Filter] [Export]
```

`Create Task` should visually dominate if it is the main action.

Do not make every button look primary.

---

# 25. Button States

Buttons must support:

```text
Default
Hover
Focus
Active
Disabled
Loading
```

Loading buttons should prevent accidental duplicate submissions.

Example:

```text
Saving...
```

instead of:

```text
Save
Save
Save
```

---

# 26. Icons

Icons should support understanding, not replace important labels.

Good:

```text
[Icon] Create Task
```

Avoid:

```text
[Unknown Icon]
```

for important actions where the meaning is unclear.

---

# 27. Icon Consistency

Use one consistent icon library/style throughout the application.

Do not mix unrelated icon styles.

---

# 28. Forms

Forms should be:

```text
Simple
Clear
Grouped
Validated
Accessible
```

Each field should have a visible label.

---

# 29. Form Layout

For desktop:

```text
Label
Input

Label
Input

Label
Textarea
```

Related fields may use columns:

```text
Project        Assignee
Priority       Deadline
```

On mobile, fields should stack vertically.

---

# 30. Input States

Inputs must support:

```text
Default
Focus
Filled
Error
Disabled
Read Only
```

---

# 31. Form Errors

Errors should appear near the relevant field.

Example:

```text
Deadline

[................]

Deadline cannot be earlier than the task creation date.
```

Avoid showing only a generic:

```text
Something went wrong.
```

when a specific validation error is available.

---

# 32. Tables

Tables are preferred for data-heavy screens.

Primary examples:

```text
Tasks
Projects
Users
Activity
Reports
```

---

# 33. Task Table

Recommended:

```text
ID
Task
Project
Assignee
Status
Priority
Deadline
Updated
Actions
```

The table should remain readable at normal desktop widths.

---

# 34. Table Behavior

Tables should support where appropriate:

```text
Sorting
Filtering
Pagination
Row Actions
Clickable Rows
Responsive Behavior
```

---

# 35. Responsive Tables

On smaller screens, large tables may transform into cards.

Example:

```text
┌─────────────────────────┐
│ Task #1042              │
│ Implement Login         │
│                         │
│ Status: In Progress     │
│ Priority: High         │
│ Due: Aug 20             │
│                         │
│ [View Task]             │
└─────────────────────────┘
```

---

# 36. Badges

Badges are appropriate for:

```text
Status
Priority
Role
Category
```

Example:

```text
[IN PROGRESS]
[HIGH]
[ADMIN]
```

Avoid using badges for long text.

---

# 37. Modals

Modals should be used for focused actions.

Good examples:

```text
Delete Confirmation
Assign Task
Create Task
Quick Edit
Review Submission
```

Avoid using large multi-step workflows inside small modals.

---

# 38. Modal Rules

A modal should:

```text
Have Clear Title
Have Clear Action
Have Cancel Option
Trap Focus
Close Predictably
Prevent Accidental Submission
```

Dangerous actions should require explicit confirmation.

---

# 39. Confirmation Dialogs

For destructive actions:

```text
Delete Task?

This action cannot be easily undone.

[Cancel] [Delete]
```

Use clear language.

Avoid:

```text
Are you sure?
```

without explaining what will happen.

---

# 40. Toast Notifications

Use toast notifications for short-lived feedback.

Examples:

```text
Task created successfully.
Task assigned successfully.
Changes saved.
Review submitted.
```

Errors may use toasts when the user can act without needing a dedicated error screen.

---

# 41. Persistent Errors

Important errors should not exist only as disappearing toasts.

Examples:

```text
Database unavailable
Authentication expired
Project access denied
File upload failed
```

These should have visible contextual handling.

---

# 42. Loading States

Use:

```text
Skeletons
Spinners
Loading Buttons
Progress Indicators
```

where appropriate.

Avoid blank screens during network operations.

---

# 43. Skeleton Loading

Skeletons are preferred for large content areas such as:

```text
Dashboard
Task Lists
Project Lists
Reports
```

The skeleton should approximately match the final content layout.

---

# 44. Empty States

Empty states should explain what happened.

Example:

```text
No tasks found.

There are no tasks matching your current filters.

[Clear Filters]
```

For completely empty projects:

```text
No tasks yet.

Create the first task for this project.

[Create Task]
```

---

# 45. Error States

Errors should explain:

```text
What happened
What the user can do
```

Example:

```text
Unable to load tasks.

Please try again.

[Retry]
```

---

# 46. Navigation

Navigation should remain predictable.

Users should be able to reach:

```text
Dashboard
Projects
Tasks
Reviews
Notifications
Reports
Activity
Settings
```

without unnecessary nested menus.

---

# 47. Task Navigation

Typical flow:

```text
Tasks
   ↓
Task Details
   ↓
Project
   ↓
Task
   ↓
Review / Activity / Files
```

Back navigation should preserve useful filters where practical.

---

# 48. Project Navigation

Typical:

```text
Projects
   ↓
Project Details
   ├── Overview
   ├── Tasks
   ├── Developers
   ├── Activity
   └── Reports
```

Only display sections permitted for the current user.

---

# 49. Dashboard UX

The dashboard should answer:

```text
What needs my attention?
What am I working on?
What is overdue?
What is waiting for review?
What is blocked?
```

Avoid filling the dashboard with metrics that do not help users take action.

---

# 50. Developer Dashboard

Recommended sections:

```text
My Active Tasks
Due Today
Overdue
In Review
Revision Required
Recent Activity
```

---

# 51. Team Lead Dashboard

Recommended:

```text
Team Workload
Active Tasks
Overdue Tasks
Review Queue
Blocked Tasks
Project Progress
```

---

# 52. Admin Dashboard

Recommended:

```text
Total Projects
Active Tasks
Completed Tasks
Overdue Tasks
Team Activity
System Activity
Reports
```

---

# 53. Task Details UX

Task details should make important information immediately visible.

Top section:

```text
Task ID
Title
Status
Priority
Assignee
Deadline
```

Then:

```text
Description
Acceptance Criteria
Comments
Files
Dependencies
Reviews
Activity
```

---

# 54. Task Actions

Actions should depend on role and state.

Example:

```text
Developer:
[Start Work]
[Submit Review]

Reviewer:
[Approve]
[Request Revision]

Admin:
[Edit]
[Assign]
[Cancel]
[Reopen]
```

Do not show actions the user cannot perform.

---

# 55. Review UX

Review screen should clearly separate:

```text
Task Information
Submission
Review Feedback
Review Actions
Review History
```

Reviewer should not have to search through the interface to find the approve/revision actions.

---

# 56. Notification Center

Notifications should show:

```text
Unread
Read
Timestamp
Source
Action
```

Example:

```text
Task #1042 was assigned to you.
5 minutes ago

[View Task]
```

---

# 57. Activity Timeline

Activity should be displayed chronologically.

Example:

```text
Today

10:32 PM
Task moved to IN_REVIEW

9:14 PM
Developer uploaded build.zip

8:45 PM
Task moved to IN_PROGRESS
```

---

# 58. Search UX

Global search should provide quick access to:

```text
Tasks
Projects
Users
```

Search results should clearly identify the result type.

Example:

```text
Task
#1042 — Implement Login

Project
Permetheon Website

User
Developer A
```

---

# 59. Filters UX

Filters should be easy to clear.

Example:

```text
[Status: In Progress ×]
[Priority: High ×]
[Developer: Ali ×]

[Clear All]
```

Active filters should be visually obvious.

---

# 60. Date UX

Dates should use a consistent format throughout the application.

Example:

```text
20 Aug 2026
```

For timestamps:

```text
20 Aug 2026, 10:42 PM
```

Relative time may be used where helpful:

```text
5 minutes ago
2 hours ago
Yesterday
```

---

# 61. Timezone

The application should use a consistent server/database strategy and clearly handle timezone conversion for users.

Do not silently mix server time and browser-local time.

---

# 62. Responsive Breakpoints

Tailwind responsive utilities should be used consistently.

General layout:

```text
Mobile
Tablet
Desktop
Large Desktop
```

Do not create unnecessary custom breakpoints unless the UI requires them.

---

# 63. Mobile Navigation

On mobile:

```text
Sidebar
    ↓
Drawer / Menu
```

The navigation must remain accessible without consuming most of the screen.

---

# 64. Mobile Task Management

Mobile users should be able to:

```text
View Task
Update Status
Add Comment
Review Information
View Files
```

where their permissions allow.

Complex editing can use a dedicated page instead of an overloaded modal.

---

# 65. Accessibility

PCT should target practical WCAG-aligned accessibility.

Requirements:

```text
Keyboard Navigation
Visible Focus
Semantic HTML
Form Labels
Accessible Buttons
Readable Contrast
Meaningful Error Messages
Alt Text Where Relevant
```

---

# 66. Keyboard UX

Common actions should support keyboard interaction.

Examples:

```text
Tab
Shift + Tab
Enter
Escape
Arrow Keys
```

Modals must properly manage focus.

---

# 67. Focus Management

When a modal opens:

```text
Focus → Modal
```

When it closes:

```text
Focus → Triggering Element
```

Do not leave keyboard focus in an inaccessible location.

---

# 68. Animations

Animations should be subtle and functional.

Appropriate:

```text
Modal Fade
Sidebar Transition
Dropdown
Toast
Loading
```

Avoid:

```text
Large Page Animations
Constant Motion
Decorative Background Animation
Long Transitions
```

---

# 69. Animation Timing

Interactions should feel immediate.

Avoid animations that make normal navigation feel slow.

---

# 70. Tailwind Usage

Tailwind CSS should be the primary styling mechanism.

Use:

```text
Utility Classes
Reusable Components
Consistent Design Tokens
Responsive Utilities
State Variants
```

Avoid excessive custom CSS when Tailwind can handle the requirement cleanly.

---

# 71. Component Reuse

Repeated UI patterns should become reusable components.

Examples:

```text
Button
Input
Select
Modal
Badge
Card
Table
Pagination
Dropdown
Toast
EmptyState
LoadingState
```

---

# 72. Feature Components

Feature-specific components should remain organized by feature.

Example:

```text
components/
├── ui/
├── tasks/
├── projects/
├── reviews/
├── notifications/
├── reports/
└── dashboard/
```

---

# 73. Design Tokens

Global design values should be centralized.

Examples:

```text
Colors
Spacing
Radius
Typography
Shadows
Transitions
```

Avoid random values scattered across components.

---

# 74. Border Radius

Use a consistent radius system.

Example categories:

```text
Small
Medium
Large
Full
```

Avoid mixing many unrelated radius values.

---

# 75. Shadows

Use shadows sparingly.

Primary hierarchy should come from:

```text
Spacing
Borders
Surface Contrast
Typography
```

rather than heavy shadows.

---

# 76. Spacing

Spacing should follow a consistent scale.

Common spacing should be reused across:

```text
Cards
Sections
Forms
Tables
Modals
Navigation
```

---

# 77. Information Density

PCT is a developer productivity application.

Therefore:

```text
Data Density > Decorative Whitespace
```

However, the UI must remain readable.

The goal is:

```text
Compact
but not cramped.
```

---

# 78. Visual Hierarchy

Important information should stand out in this order:

```text
Primary Action
Task / Project Name
Status / Priority
Deadline
Assignee
Metadata
Secondary Information
```

---

# 79. Destructive Actions

Destructive actions must be visually distinguishable.

Examples:

```text
Delete
Remove
Cancel Project
Revoke Access
```

Require confirmation when appropriate.

---

# 80. Permission-Based UI

If a user does not have permission:

```text
Do not show the action
```

where practical.

However:

```text
Hidden UI ≠ Security
```

The backend must still enforce authorization.

---

# 81. Error Prevention

The UI should prevent common mistakes.

Examples:

```text
Disable duplicate submit
Confirm destructive actions
Validate required fields
Warn about unsaved changes where appropriate
Prevent invalid status transitions
```

---

# 82. Unsaved Changes

Forms with significant data may warn users before leaving with unsaved changes.

Do not add unnecessary confirmation dialogs to every minor input.

---

# 83. Notifications vs Modals

Use:

```text
Toast
→ Small confirmation

Modal
→ Focused decision

Full Page
→ Complex workflow or major error
```

Choose the least disruptive UI that communicates the required information.

---

# 84. Data Refresh

After mutations:

```text
Create
Update
Delete
Status Change
Review
Comment
```

the UI must reflect the latest state.

Avoid requiring users to manually refresh the browser.

---

# 85. Optimistic Updates

Optimistic UI may be used for low-risk operations where appropriate.

Example:

```text
Mark Notification as Read
```

For important database mutations, prefer confirmed server responses before presenting the final state.

---

# 86. API Loading UX

While waiting for API responses:

```text
Disable Duplicate Actions
Show Loading State
Preserve Context
Display Error if Request Fails
```

Do not leave the user wondering whether an action happened.

---

# 87. Authentication UX

Login should be:

```text
Simple
Fast
Clear
Secure
```

Required:

```text
Email / Username
Password
Login
Error Feedback
```

If applicable:

```text
Remember Session
Logout
Session Expiration
```

---

# 88. Unauthorized UX

If a user lacks permission:

```text
Access Denied
```

should be clearly communicated.

Do not expose sensitive resource information.

---

# 89. Not Found UX

For missing resources:

```text
Task Not Found
Project Not Found
Page Not Found
```

Provide useful navigation:

```text
[Back]
[Go to Dashboard]
```

---

# 90. Network Failure UX

If the API is unavailable:

```text
Unable to connect to the server.

Please try again.
```

Provide:

```text
[Retry]
```

where appropriate.

---

# 91. UX Consistency Rule

If two screens perform similar actions, they should behave similarly.

Example:

```text
Create Project
Create Task
Create User
```

should share common form and button behavior.

---

# 92. No Dark Patterns

PCT must never use:

```text
Hidden Destructive Actions
Misleading Buttons
Forced Navigation
Confusing Confirmation Text
Fake Notifications
Manipulative UX
```

---

# 93. Performance UX

The interface should feel fast.

Prioritize:

```text
Fast Initial Load
Fast Navigation
Fast Search
Fast Filtering
Minimal Unnecessary Requests
```

Large datasets should use:

```text
Pagination
Server-Side Filtering
Server-Side Search
```

where appropriate.

---

# 94. Final UI/UX Checklist

Before considering a screen complete:

```text
[ ] Layout is consistent
[ ] Typography is consistent
[ ] Spacing is consistent
[ ] Buttons have correct hierarchy
[ ] Forms are accessible
[ ] Loading state exists
[ ] Empty state exists
[ ] Error state exists
[ ] Success feedback exists
[ ] Permission-based actions work
[ ] Responsive layout works
[ ] Keyboard navigation works
[ ] No unnecessary animation
[ ] No console UI errors
[ ] API failures are handled
[ ] Destructive actions are protected
```

---

# 95. Final Design Rule

> **PCT should feel like a professional internal command center for developers: fast, clean, information-dense, predictable, and easy to operate. Every visual element must have a functional reason to exist.**
