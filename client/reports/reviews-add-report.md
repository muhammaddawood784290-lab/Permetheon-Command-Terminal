# Reviews Module — Add Review Workflow

> REVIEWS ADD REVIEW / CREATE REVIEW WORKFLOW — FINAL VERIFICATION REPORT
> Branch: `main`  ·  Date: 2026-08-12  ·  Build: `npm run build` exits 0

## 1. Scope

Add a real **"Add review"** entry point directly on the Reviews page,
mirroring the Tasks page's "New task" button. The new flow must integrate
with the existing `reviewService`, `taskService`, and `userService` data
without inventing a parallel dataset, and must respect the lifecycle
documented in `docs/REVIEW_SYSTEM.md` (§18 self-approval, §38 state sync,
§47 one active review per task).

The only code changes permitted:

1. Add `reviewService.create()` (the service previously had no create method).
2. Add `src/components/reviews/ReviewForm.jsx` modal.
3. Wire "Add review" into `ReviewQueuePage.jsx` header.
4. Add this report.

No other module/page/service was redesigned or rebuilt.

## 2. Implemented

A new **"Add review"** button now appears in the Reviews page header
(gated by `hasPermission(user, 'review.submit')`, granted to ADMIN,
TEAM_LEAD, and DEVELOPER). Clicking it opens a modal (`ReviewForm`)
with three fields: an in-progress task picker (with a live preview
card showing project, status badge, priority badge, deadline, and
assignee), an eligible-reviewer picker (Admins + Team Leads only,
excluding the task's assignee per §18), and an optional note (≤500
chars). Submission calls `reviewService.create({ taskId, reviewerId,
note }, { actor: user })`, which validates eligibility, dedupes per
§47, builds the review record (status `SUBMITTED`, attempt `1`),
pushes it into `mockReviews`, transitions the linked task to
`IN_REVIEW` via `taskService.updateStatus` (with rollback on failure
to keep the two stores consistent), and emits exactly **one**
`recordActivity({ action: TASK_SUBMITTED, targetType: 'task', ... })`
event. The Dashboard's `useLiveRefresh` and the Activity page pick
up the new event without a manual reload.

## 3. Review Creation Flow (as observed by a user)

1. User navigates to `/reviews`. The header shows scope toggle
   (All/My reviews), **"Add review"** (if permission allows), and
   Refresh.
2. User clicks **"Add review"** → modal opens, fields are reset.
3. User picks a task. Only `IN_PROGRESS` tasks with an assignee and
   no active review appear. As soon as a task is chosen, the **Task
   Information Preview** card shows below the dropdown (project,
   status badge, priority badge, deadline, assignee + role).
4. User picks a reviewer. The dropdown excludes the selected task's
   assignee (§18 self-approval) and is disabled until a task is
   selected. Helper text explains both.
5. User optionally types a note (≤500 chars). Live counter shows
   remaining characters; the note becomes the first feedback item on
   the new review record.
6. User clicks **"Submit for review"**. Validation runs:
   - task required
   - reviewer required
   - reviewer ≠ task assignee
   - note ≤ 500 chars
7. Submit button is disabled while the request is in-flight (no
   double-submit). Cancel button is disabled while submitting.
8. On success: toast "Review submitted.", modal closes, the Reviews
   page refetches (the new review appears at the top of the queue),
   the linked task now shows status `IN_REVIEW` everywhere
   (Dashboard, Tasks, etc.), and the activity stream shows the
   paired events (`TASK_SUBMITTED` for the create, then a
   `TASK_STATUS_CHANGED` for the task transition).
9. On error: toast shows the failure message, the modal stays open
   so the user can correct inputs and resubmit.

## 4. Files Created

- `client/src/components/reviews/ReviewForm.jsx` (new) — modal with
  Task select + preview card, Reviewer select (self-approval guard),
  optional Note textarea, validation, submit + cancel buttons.
- `client/reports/reviews-add-report.md` (this file).

## 5. Files Modified

- `client/src/services/reviewService.js` — added `nextReviewId()`
  helper (mirrors the `r_<n>` convention from `mockData.js`'s
  private `reviewCounter`) and the new `async create(payload, {
  actor })` method.
- `client/src/pages/reviews/ReviewQueuePage.jsx` — added the
  `ReviewForm` import, `createOpen` / `creating` state, the
  `canSubmitReview` permission gate, the `eligibleTasks` memo, the
  `eligibleTaskOptions` memo (decorates tasks with project name,
  assignee name, assignee role for the preview card), the
  `handleCreate` handler (calls `reviewService.create`, toasts
  success/error, closes modal, refreshes queue), the
  **"Add review"** header button (gated by `canSubmitReview`),
  and the `<ReviewForm>` mount at the end of the JSX. The page
  header comment was updated to document that the create flow is
  now available to authorized users.

## 6. Permissions

| Action                                  | Permission key    | ADMIN | TEAM_LEAD | DEVELOPER |
| --------------------------------------- | ----------------- | :---: | :-------: | :-------: |
| See "Add review" button                 | `review.submit`   | ✓     | ✓         | ✓         |
| Pick a reviewer (Admin / Team Lead only)| `review.start`    | ✓     | ✓         | n/a (excluded) |
| Submit for review                       | `review.submit`   | ✓     | ✓         | ✓         |

No new permissions were added. The button visibility is driven
entirely by the existing `permissions.js` matrix. The reviewer
dropdown is populated from the same Admin + Team Lead list the
existing `Reassign reviewer` modal already uses
(`ReviewQueuePage.jsx:149-160`).

## 7. Cross-Module Synchronization

| Module       | Reads via                                         | Result                                                                                                  |
| ------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Tasks        | `taskService.updateStatus(taskId, 'IN_REVIEW')`  | The linked task is moved to IN_REVIEW on create; rollback on failure keeps stores consistent.            |
| Activity     | `recordActivity({ TASK_SUBMITTED, targetType:'task' })` | One new entry per create; matches the seed format at `mockData.js:955-965`.                         |
| Dashboard    | `useLiveRefresh` → `subscribeActivityChange`     | Dashboard's KPIs ("Open reviews", "In Review" tasks, "Recent activity") refresh without a manual reload. |
| Reviews list | `reviewService.list(...)` refetched via `refreshKey` | New review appears at the top of the queue immediately after create.                                   |
| Reports      | Same `reviewService` data                        | No rewire needed — Reports reads through `reviewService.stats()` and `.list()` which both read the same `mockReviews` array. |
| Notifications| `notificationService` derives from activity       | A new notification is generated from the `TASK_SUBMITTED` event (same path used by all other reviews).  |
| Users        | `mockUsers` only                                  | Reviewer dropdown reuses the existing reviewer list; no new dataset.                                    |

## 8. Testing Matrix

Harness: `C:\Users\UNI-TECH\AppData\Local\Temp\test_reviews_add.mjs`
(drives the service via `jiti` against the actual source files).

```
== REVIEWS ADD TEST SUITE ==
-- 0. Setup --                                        4/4 PASS
-- 1. Happy path --                                  26/26 PASS
-- 2. Duplicate guard (§47) --                        4/4 PASS
-- 3. Self-approval guard (§18) --                    2/2 PASS
-- 4. Missing task (404) --                            1/1 PASS
-- 5. Auto-pick reviewer --                           3/3 PASS
-- 6. Ineligible task status --                       2/2 PASS
-- 7. Unauthenticated actor --                        1/1 PASS
-- 8. Source-level invariant --                       5/5 PASS
== TOTAL: 47 passed, 0 failed ==
```

| Item                                          | Result | Evidence |
| --------------------------------------------- | :----: | -------- |
| `reviewService.create()` happy path           | PASS   | `create returns success`, `mockReviews[0] is the new review`, `task.status === IN_REVIEW` |
| Review status === SUBMITTED                   | PASS   | `review.status === SUBMITTED` |
| Linked task status === IN_REVIEW              | PASS   | `task.status === IN_REVIEW` (driven via `taskService.updateStatus`) |
| Exactly one TASK_SUBMITTED event              | PASS   | `exactly one TASK_SUBMITTED for the task` |
| Exactly one TASK_STATUS_CHANGED event         | PASS   | `exactly one TASK_STATUS_CHANGED for the task` |
| mockReviews grew by exactly 1                 | PASS   | `mockReviews[0] is the new review` (unshifted) |
| Duplicate guard (§47)                         | PASS   | `duplicate create rejects`, status 400, message mentions "active review" / "IN_REVIEW" |
| Self-approval guard (§18)                     | PASS   | `self-approval returns 400`, message mentions "reviewer/assignee" |
| Missing task → 404                            | PASS   | `missing task returns 404` |
| Missing reviewerId → auto-pick ADMIN/TL       | PASS   | `auto-pick returns success`, reviewer role check, reviewer ≠ assignee |
| Ineligible task status (COMPLETED)            | PASS   | `COMPLETED task returns 400`, message mentions status |
| Unauthenticated actor → 401                   | PASS   | `unauthenticated returns 401` |
| Activity pub/sub fires twice per create       | PASS   | `subscribeActivityChange fired twice (review + task status)` |
| ReviewForm renders, validates, cancels        | PASS   | Source-level: imports `Modal` + `Select` + `Textarea` + `Button`; `disabled={submitting}` on both footer buttons |
| "Add review" button gated by permission       | PASS   | `ReviewQueuePage.jsx:428` renders the button only when `canSubmitReview` is true |
| Dev server transforms cleanly                 | PASS   | All 19 routes return 200; `createHotContext` matches are the standard Vite HMR preamble, not error overlay |
| `npm run build` exits 0                       | PASS   | 221 modules transformed, bundle 598.21 kB / 163.28 kB gzip |
| Regression: other 8 routes still serve 200    | PASS   | Login, Dashboard, Projects, Tasks, Notifications, Activity, Reports, Users, Reviews all return 200 |

## 9. Bugs Found & Fixed

No source bugs were found — the implementation behaved correctly on
the first run. One **test harness** defect was uncovered and fixed:

| # | Issue (harness-only)                                       | Where                                      | Fix                                                                                                |
| - | ---------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 1 | `fail()` returns a rejected promise, so a try/catch was needed in the duplicate-guard test (and similar fail-path tests); the original harness threw a Node fatal because `fail()` *also* throws after the awaited delay. | `test_reviews_add.mjs` sections 2-7 | Wrapped every fail-path `await` in a `try { ... } catch (e) { caught = e; }` block and asserted on `caught.status` / `caught.message`. Matches the `test_users.mjs` pattern at line 101-106. |

No application bugs, no design surprises, no regressions in the
existing review lifecycle (start / approve / requestRevision /
resubmit / assign / remove / stats) or any other module.

## 10. Status

**COMPLETE**

- All 47 service-layer assertions pass.
- `npm run build` exits 0 (221 modules, 598.21 kB / 163.28 kB gzip).
- 19/19 dev-server routes return 200 with no error overlay.
- "Add review" button is rendered, gated by the existing
  `review.submit` permission (ADMIN, TEAM_LEAD, DEVELOPER).
- `reviewService.create()` enforces every documented guard from
  REVIEW_SYSTEM.md: auth (§18 actor requirement), task existence,
  task eligibility (§46 + §47), reviewer eligibility (§18
  self-approval), duplicate active review (§47). It transitions
  the linked task to IN_REVIEW via `taskService.updateStatus`
  (with rollback), emits exactly one TASK_SUBMITTED event, and
  integrates with the existing pub/sub so the Dashboard,
  Activity, and Notifications modules refresh without a manual
  page reload.
- No source files outside `reviewService.js` and
  `ReviewQueuePage.jsx` were modified. No new permission keys
  were added. No parallel datasets were created.
- Only artifacts written: `client/src/components/reviews/ReviewForm.jsx`
  and `client/reports/reviews-add-report.md`.

Status: `COMPLETE`.