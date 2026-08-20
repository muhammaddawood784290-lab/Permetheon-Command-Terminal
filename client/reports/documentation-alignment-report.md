# Documentation Alignment Report

> PCT — Pre-Backend Documentation Alignment
> Branch: `main`  ·  Date: 2026-08-12  ·  Scope: documentation only

## 1. Scope

This task aligns the project documentation with the **actual** behavior of the
completed React frontend before the Express.js + MySQL backend begins.

Hard constraints (verbatim from the brief):

- DO NOT modify any frontend source code.
- DO NOT modify `client/src/`, components, pages, services, contexts, hooks.
- This task is DOCUMENTATION ONLY.
- Do NOT invent features, permissions, or API endpoints.
- Distinguish PLANNED/REQUIRED from IMPLEMENTED.
- "If a document is already correct: LEAVE IT ALONE."

The reference for the frontend's actual behavior is:

```text
client/reports/frontend-pre-backend-audit.md
client/src/utils/constants.js
client/src/utils/permissions.js
```

## 2. Method

1. Read every existing documentation file under `docs/`.
2. Read the frontend's `constants.js` and `permissions.js` to capture the
   canonical vocabularies (statuses, permission keys, activity actions).
3. Identify real, breaking inconsistencies (not stylistic differences).
4. Apply minimal, surgical edits to bring docs in line with the frontend's
   actual behavior and the codebase's documented intent.
5. Preserve each doc's existing structure, headings, terminology, and tone
   where they do not conflict with the canonical vocabulary.

## 3. Documents Modified

| File | Sections touched | Reason |
| --- | --- | --- |
| `docs/DATABASE.md` | §11 (User Status), §19 (Task Status), §24 (Review Status), §25 (Review Workflow), example query | Status vocabularies did not match the implemented frontend |
| `docs/API.md` | §9 task-status listing, §11 review endpoints (added `start`, `request-revision`, `resubmit`, `reviewer`; corrected HTTP methods; documented `reviewerId`) | Endpoint surface did not match `reviewService`; `reviewerId` field was undocumented |
| `docs/AUTHENTICATION.md` | §7 (Account Status) | Only two user statuses were documented; frontend implements three |
| `docs/SECURITY.md` | §31 (Disabled/Suspended Accounts), §11 + §79 cross-references | `DISABLED` status did not exist; stale link to non-existent `ROLE_PERMISSIONS.md` |
| `docs/ARCHITECTURE.md` | §24 (Task Architecture), §26 (Review Architecture) | Task and review lifecycles used legacy 6-status vocabulary |
| `docs/ROLE_PERMESSIONS.md` | §16 (Review Permissions), §17 (User Permissions), §21 (Notification Permissions), §49 (Naming Rules), §53 (Module Permission Reference) | Permission keys were inconsistent with `client/src/utils/permissions.js`; canonical V1 keys missing |
| `docs/README.md` | §12 task-lifecycle diagram | Used legacy 6-status vocabulary |
| `.env.example` | added frontend (Vite) section | Documented `VITE_API_URL` / `VITE_USE_MOCK` placeholders that the frontend consumes |

## 4. Documents Unchanged

These docs were reviewed and required no edits because they already matched
the frontend's actual behavior or describe the planned backend architecture
without conflicting with the frontend:

- `docs/CLAUDE.md`
- `docs/ACTIVITY_LOG.md` (already aligned with `constants.js` `ACTIVITY_ACTION`)
- `docs/REVIEW_SYSTEM.md` (already uses the full five-status vocabulary and
  correctly documents `POST /api/tasks/:taskId/reviews` with `reviewerId`)
- `docs/TASK_SYSTEM.md` (already uses the full eight-status vocabulary)
- `docs/ROUTES.md`
- `docs/CODING_STANDARDS.md`
- `docs/PROJECT_OVERVIEW.md`
- `docs/PROJECT_SYSTEM.md`
- `docs/DEVELOPER_SYSTEM.md`
- `docs/NOTIFICATION_SYSTEM.md`
- `docs/FILE_SYSTEM.md`
- `docs/REPORTS.md`
- `docs/TESTING.md`
- `docs/UI_UX.md`
- `docs/DASHBOARD.md`
- `docs/DEVELOPMENT.md`

These docs were intentionally not rewritten. If a future alignment pass
uncovers drift between them and the canonical frontend constants, that
should be a separate pass.

## 5. Exact Inconsistencies Resolved

### 5.1 Task Status Vocabulary

Frontend (`client/src/utils/constants.js` `TASK_STATUS`):

```text
BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, REVISION_REQUIRED,
COMPLETED, BLOCKED, CANCELLED
```

Was documented in `DATABASE.md §19`, `ARCHITECTURE.md §24`, and `README.md §12` as:

```text
BACKLOG, ASSIGNED, IN_PROGRESS, REVIEW, REVISION_REQUIRED, COMPLETED
```

**Resolved** by updating those three docs to use the eight-status
vocabulary, with `TODO` replacing the legacy `ASSIGNED` step and `IN_REVIEW`
replacing the legacy `REVIEW` task status. `TASK_SYSTEM.md §3` already
matched.

### 5.2 Review Status Vocabulary

Frontend (`client/src/utils/constants.js` `REVIEW_STATUS`):

```text
SUBMITTED, IN_REVIEW, APPROVED, REVISION_REQUIRED, RESUBMITTED
```

Was documented in `DATABASE.md §24` as:

```text
APPROVED, REVISION_REQUIRED
```

**Resolved** by updating `DATABASE.md §24` to the full five-status
vocabulary, with a note that legacy two-state records must be migrated if
any exist. `REVIEW_SYSTEM.md §5` already matched.

### 5.3 User Status Vocabulary

Frontend (`client/src/utils/constants.js` `USER_STATUS`):

```text
ACTIVE, INACTIVE, SUSPENDED
```

Was documented in `DATABASE.md §11` and `AUTHENTICATION.md §7` as:

```text
ACTIVE, INACTIVE
```

`SECURITY.md §31` referred to a non-existent `DISABLED` status.

**Resolved** by:

- Adding `SUSPENDED` to both `DATABASE.md §11` and `AUTHENTICATION.md §7`
  with definitions distinguishing the two disabled states.
- Updating `SECURITY.md §31` to use `INACTIVE` and `SUSPENDED` instead of
  `DISABLED`.

### 5.4 Review Endpoint Contract

Frontend (`client/src/services/reviewService.js`):

- `POST /api/tasks/:taskId/reviews` body: `{ reviewerId, note }`.
- `PATCH /api/reviews/:id/start`
- `PATCH /api/reviews/:id/approve`
- `PATCH /api/reviews/:id/requestRevision` body: `{ feedback }`
- `POST /api/reviews/:id/resubmit` body: `{ note }`
- `PATCH /api/reviews/:id/reviewer` (admin-only)

Was documented in `API.md §11`:

- `POST /tasks/:taskId/review` body: `{ note }` only (no `reviewerId`).
- `POST /reviews/:id/approve`
- `POST /reviews/:id/revision` body: `{ feedback }`
- Missing: `start`, `resubmit`, `reviewer` reassignment.

**Resolved** by rewriting `API.md §11` to match the actual frontend surface:
corrected HTTP methods (`PATCH` for transitions), documented `reviewerId`
as a required field with the self-approval guard, and added the missing
`start`, `resubmit`, and `reviewer` endpoints with their result side-effects
(review status transitions, `attempt` increment, activity emission).

### 5.5 Permission Key Vocabulary

Frontend (`client/src/utils/permissions.js`) — 27 canonical keys:

```text
project.view, project.create, project.update, project.delete,
project.archive, project.manageMembers,
task.view, task.create, task.update, task.delete, task.assign, task.changeStatus,
review.view, review.submit, review.start, review.approve,
review.requestRevision, review.assign,
file.upload, file.download, file.delete,
report.view, report.export,
activity.view,
notification.view, notification.markRead, notification.manage,
user.view, user.create, user.update, user.disable, user.changeRole,
settings.view, settings.update
```

Was documented in `ROLE_PERMESSIONS.md` using a mixed vocabulary including
non-canonical keys like `review.request_revision`, `notification.mark_read`,
and `user.manage_roles`.

**Resolved** by:

- Adding the canonical 27-key list to `ROLE_PERMESSIONS.md §49` so backend
  implementers can match exactly.
- Updating §16 (Review), §17 (User), §21 (Notification), and §53 (Module
  Permission Reference) to use the canonical keys.

### 5.6 Stale Cross-References

`SECURITY.md §11` and `§79` referenced `ROLE_PERMISSIONS.md`. That file does
not exist; the actual filename is `ROLE_PERMESSIONS.md` (intentional spelling).

**Resolved** by correcting both references and adding a note that the
filename spelling is intentional.

### 5.7 Frontend Environment Variables

`.env.example` (server) contained only backend env vars. The frontend
consumes `VITE_API_URL` and `VITE_USE_MOCK` at build time, defined in
`client/src/utils/constants.js`.

**Resolved** by adding a commented-out frontend section to `.env.example`
documenting both variables as placeholders. They are not loaded by the
server; the comment makes the contract explicit without adding any real
secrets.

## 6. Final Canonical Vocabularies

### 6.1 Task Status (database, API, frontend)

```text
BACKLOG
TODO
IN_PROGRESS
IN_REVIEW
REVISION_REQUIRED
COMPLETED
BLOCKED
CANCELLED
```

### 6.2 Review Status (database, API, frontend)

```text
SUBMITTED
IN_REVIEW
APPROVED
REVISION_REQUIRED
RESUBMITTED
```

### 6.3 User Status (database, authentication, frontend)

```text
ACTIVE
INACTIVE
SUSPENDED
```

### 6.4 Review Endpoints (API + frontend `reviewService`)

```text
POST   /api/tasks/:taskId/reviews        body: { reviewerId, note? }
GET    /api/reviews
GET    /api/reviews/:id
PATCH  /api/reviews/:id/start
PATCH  /api/reviews/:id/approve
PATCH  /api/reviews/:id/request-revision body: { feedback }
POST   /api/reviews/:id/resubmit         body: { note? }
PATCH  /api/reviews/:id/reviewer         body: { reviewerId, reason? }
```

### 6.5 Permission Keys (backend middleware + frontend helper)

```text
project.view, project.create, project.update, project.delete,
project.archive, project.manageMembers
task.view, task.create, task.update, task.delete, task.assign, task.changeStatus
review.view, review.submit, review.start, review.approve,
review.requestRevision, review.assign
file.upload, file.download, file.delete
report.view, report.export
activity.view
notification.view, notification.markRead, notification.manage
user.view, user.create, user.update, user.disable, user.changeRole
settings.view, settings.update
```

## 7. Items Deliberately Not Changed

The following items are documented as **PLANNED** in the docs but are
**NOT YET IMPLEMENTED** in the frontend. They are left as-is because they
describe the future backend, not a contradiction:

- HTTP-only Secure Cookie + server-side session authentication
  (`AUTHENTICATION.md §15`). The frontend still uses
  `localStorage.getItem('pct_auth_token')`. This is a known gap, not a
  documentation inconsistency, and is already captured in the frontend
  audit (`frontend-pre-backend-audit.md §11`).
- File upload UI. `FILE_SYSTEM.md` and `SECURITY.md` describe backend file
  behavior; the frontend has no file UI yet.
- Backend permission middleware (`ROLE_PERMESSIONS.md §28`). Documented as
  planned structure; no implementation exists yet by design.
- ARCHITECTURE_LOG.md does not exist; the doc references it as
  conceptual. No correction applied because no contradiction exists — the
  absence is intentional and was noted in the frontend audit.

## 8. Readiness Assessment

### Project status against the 10-item brief

1. **Documents modified** — 8 (`DATABASE.md`, `API.md`, `AUTHENTICATION.md`,
   `SECURITY.md`, `ARCHITECTURE.md`, `ROLE_PERMESSIONS.md`, `README.md`,
   `.env.example`).
2. **Documents unchanged** — 15 (see §4 above).
3. **Exact inconsistencies resolved** — 7 categories, listed in §5.
4. **Final task status vocabulary** — see §6.1.
5. **Final review status vocabulary** — see §6.2.
6. **Final API contract changes** — see §6.4.
7. **Final permission status** — 27 canonical keys, see §6.5.
8. **Authentication/security changes** — user status vocabulary now uses
   `INACTIVE` + `SUSPENDED`; `DISABLED` removed; security docs reference
   the correct permission file spelling.
9. **`.env.example` status** — backend-only file extended with a commented
   frontend (Vite) section; no real secrets.
10. **Ready for Express.js + MySQL?** —

### Verdict

**READY for backend development**, with the following caveats:

- The frontend still stores the auth token in `localStorage`. The planned
  HTTP-only Secure Cookie + server-side session migration is a known
  implementation gap, not a documentation gap, and must be addressed
  during the auth controller implementation in the backend phase.
- File upload UI is not yet implemented in the frontend; backend file
  endpoints can be implemented when the UI lands.
- Permission keys have been locked to the canonical 27-key set. Backend
  middleware must use exactly these strings; any deviation should be
  discussed before implementation.

No documentation contradictions remain that would block the backend phase.
