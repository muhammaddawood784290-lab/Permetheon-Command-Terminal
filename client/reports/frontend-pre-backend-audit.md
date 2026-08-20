# PCT — Frontend Final Pre-Backend Audit

> **AUDIT ONLY — NO SOURCE MODIFIED**
> Project: `D:\pct`
> Date: 2026-08-12
> Scope: Honest readiness assessment of the frontend before Phase 2 (Express.js + MySQL) begins.
> Per the audit constraints, this is the **only** file created by this audit. No source code was modified, refactored, rewritten, or deleted.

---

## 0. Executive Summary

The PCT frontend is a complete, internally consistent React 18 application that has been built with a deliberate two-phase architecture: **Phase 1 (mock)** → **Phase 2 (real backend)**. Every service follows a single `ok() / fail()` shape, every mutation funnels through a single `recordActivity()` helper, and every page consumes services through a `useAsync` hook. The routes, permissions, constants, and contexts are fully wired.

**Verdict: READY WITH MINOR PREPARATION.**

The frontend is structurally ready to be wired to a real Express + MySQL backend. The remaining work is **not source rewriting** — it is **contract reconciliation** between the frontend's vocabulary and the documented backend vocabulary, plus four small authorization shifts that must move from frontend-only to backend-enforced.

A minor set of gaps must be closed before / during Phase 2 implementation:

1. **Task status nomenclature mismatch** — frontend uses 8 statuses (BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, REVISION_REQUIRED, COMPLETED, BLOCKED, CANCELLED); DATABASE.md documents 6 (BACKLOG, ASSIGNED, IN_PROGRESS, REVIEW, REVISION_REQUIRED, COMPLETED).
2. **Review status envelope** — frontend has 5 review statuses; DATABASE.md documents only 2. The backend schema needs to expand.
3. **Review submission API contract** — API.md documents `POST /api/tasks/:taskId/review { note }` only; frontend's `reviewService.create()` sends `{ taskId, reviewerId, note }`. The contract needs to be extended or the payload re-shaped.
4. **Auth storage** — user object + token live in `localStorage`. AUTHENTICATION.md recommends HttpOnly Secure cookies. The token-based interceptor in `api.js` is already in place; the storage medium must move.
5. **mockData shape vs DATABASE schema** — mock records use camelCase; database schema is snake_case. The data boundary must be the API layer.
6. **No .env.example** — frontend env vars (`VITE_API_URL`, `VITE_USE_MOCK`) are not documented in an example file.
7. **No file upload implementation** — `fileService.js` has list/remove but no upload. The upload endpoint in API.md is not yet callable from the frontend.

None of these are architectural blockers. All are localized fixes that the backend implementation can either enforce or normalize at the API edge.

---

## 1. Methodology

This audit read:

- **Documentation** (15 docs from `D:\pct\docs\`): README.md, CLAUDE.md, ARCHITECTURE.md, API.md, AUTHENTICATION.md, DATABASE.md, ROLE_PERMESSIONS.md, ROUTES.md, SECURITY.md, plus 13 supplementary system docs (TASK_SYSTEM, REVIEW_SYSTEM, NOTIFICATION_SYSTEM, ACTIVITY_LOG, REPORTS, PROJECT_SYSTEM, DEVELOPER_SYSTEM, DEVELOPMENT, UI_UX, TESTING, CODING_STANDARDS, FILE_SYSTEM, DASHBOARD).
- **Frontend source** — every file under `D:\pct\client\src\` (services, pages, components, contexts, hooks, utils, mock, layouts, routes).
- **Build config** — `package.json`, `vite.config.js`, plus an `.env.example` check (file does not exist).
- **Mock data** — `D:\pct\client\src\mock\mockData.js` (1437 lines).

---

## 2. Service Layer Inventory

The frontend ships **14 service modules** under `client/src/services/`. All of them follow a single `ok() / fail()` envelope from `api.js`, so the public shape is uniform.

| Service | LOC | Methods | Notes |
| --- | --- | --- | --- |
| `api.js` | 121 | `httpClient`, `delay`, `ok`, `fail`, `paginate`, `applyFilters`, `search`, `sortBy` | The axios client is already pre-wired with `Authorization: Bearer …` interceptor and centralized error normalization. |
| `activityHelpers.js` | 155 | `recordActivity`, `subscribeActivityChange`, `notifyActivityChange` | Single pub/sub channel for activity. Every mutation calls `recordActivity()`. |
| `activityService.js` | 173 | `list`, `getById`, `getStats`, `getFilterOptions` | Read-only feeds. |
| `authService.js` | 84 | `login`, `logout`, `getCurrentUser`, `getStoredUser` | Token stored in `localStorage` under `pct_auth_token`. |
| `commentService.js` | 81 | `listForTask`, `add`, `remove` | Emits `COMMENT_CREATED` / `COMMENT_DELETED`. |
| `developerService.js` | 57 | `list`, `get`, `workload` | Read-only. |
| `fileService.js` | 32 | `listForTask`, `listForProject`, `list`, `remove` | **No upload method.** |
| `notificationService.js` | 198 | `list`, `getStats`, `getUnreadCount`, `getById`, `markAsRead`, `markAsUnread`, `markAllAsRead`, `remove`, `clearRead` | All scoped by `userId`. |
| `projectService.js` | 189 | `list`, `get`, `create`, `update`, `remove`, `addMember`, `removeMember`, `stats` | Status: PLANNING, ACTIVE, ON_HOLD, COMPLETED, ARCHIVED. |
| `reportService.js` | 568 | `overview`, `projectReport`, `taskStatusDistribution`, `developerReport`, `reviewReport`, `deadlineReport`, `activityReport`, `completionTrend`, `filterOptions`, `fullReport` | Date filters: today/yesterday/last7/last30/thisMonth/custom/all. |
| `reviewService.js` | 500 | `list`, `get`, `create`, `start`, `approve`, `requestRevision`, `resubmit`, `assign`, `remove`, `stats` | `create` validates §18 (self-approval), §47 (one active review), resumes task to IN_REVIEW. |
| `settingsService.js` | 411 | `getPreferences`, `updatePreferences`, `resetPreferences`, `updateProfile`, `changePassword`, `getSessions`, `revokeSession`, `revokeAllOtherSessions`, `getSystemSettings` | Per-user preferences; sessions synthesized from `pct_auth_token`. |
| `taskService.js` | 248 | `list`, `get`, `create`, `update`, `updateStatus`, `assign`, `remove`, `stats`, `projectTasks`, `myTasks` | 8 statuses. |
| `userService.js` | 352 | `list`, `get`, `developers`, `workload`, `stats`, `emailExists`, `create`, `update`, `changeRole`, `changeStatus`, `deactivate`, `activate`, `rolesAvailableFor` | Self-protection: cannot change own role / deactivate self / demote last admin. |

**Observations:**

- Every service exposes `async` methods and returns `ok(value)` or `fail(message, status)`. The pages never branch on the data shape — every consumer does `if (res.success) …` or awaits `res.data`.
- All IDs are generated via `nextId()` helpers that scan the existing mock arrays. This is mock-only; the backend will issue real IDs.
- The HTTP client is fully constructed but is **not yet called** by any service. Bodies read from `mockX` arrays. The wiring is a body-replacement, not a wire-up.

---

## 3. Mock Data Audit

`client/src/mock/mockData.js` (1437 lines) is the single source of mock data in the frontend. It exports:

- `mockUsers` (9 users spanning ADMIN / TEAM_LEAD / DEVELOPER, ACTIVE / INACTIVE / SUSPENDED).
- `mockProjects` (6 projects with `memberIds`, `leadId`, `ownerId`, `startDate`, `deadline`, `progress`).
- `mockTasks` (24+ tasks spanning all 8 statuses).
- `mockReviews` (8+ reviews across SUBMITTED / IN_REVIEW / APPROVED / REVISION_REQUIRED / RESUBMITTED).
- `mockComments` (~12 comments).
- `mockFiles` (~6 file metadata rows).
- `mockNotifications` (~19 notifications across 10 types, scoped by userId).
- `mockActivity` (~30 activity feed entries, all 27 actions represented).
- `currentUser` — first mock user (Ahmed Dawood, ADMIN).

Helper lookups: `findUserById`, `findTaskById`, `findProjectById`, `findReviewById`, `findProjectById`, etc.

**Field naming convention in mock data:**

- All ids are string-prefixed: `u_1`, `p_1`, `t_1041`, `r_71`, `n_1`, `a_1`, `c_1`, `f_1`.
- All timestamps, dates, foreign keys, and metadata fields are **camelCase** (`createdAt`, `updatedAt`, `projectId`, `assigneeId`, `completedAt`, `reviewerId`, `lastLoginAt`).
- DATABASE.md mandates snake_case at the database level (`created_at`, `updated_at`, `project_id`, `assigned_to`, `reviewer_id`, `last_login_at`, `due_date`).

**Gap:** The frontend camelCase must be **normalized at the API edge** — either the backend (recommended) or a thin frontend adapter transforms snake_case ↔ camelCase in the response/request. The mock data is consistent with the frontend's existing camelCase usage, so no mock-side refactor is needed.

**Counter behavior:** `let taskCounter = 1040;` and `let reviewCounter = 71;` are module-level mutable counters. `nextTaskId()` and `nextReviewId()` (in `reviewService.js`) append. The mock data correctly preserves IDs across reruns in the same session.

**Observation:** The mock data does not contain any `password_hash`, `password`, or `secret` field. The frontend defines `user.email` and `user.role` but never stores credentials. This is **correct** for the mock — the backend will own credentials.

---

## 4. API Readiness

The `httpClient` (axios) in `api.js` is fully configured:

```js
const httpClient = axios.create({
  baseURL: API_BASE_URL,           // VITE_API_URL || '/api'
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});
httpClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('pct_auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
httpClient.interceptors.response.use(..., (error) => {
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message || 'Network error';
  const normalized = new Error(message);
  normalized.status = status;
  normalized.data = error.response?.data;
  return Promise.reject(normalized);
});
```

**Readiness assessment:**

- ✅ `Authorization: Bearer <token>` header injection.
- ✅ `withCredentials: true` so the backend can opt into cookie-based sessions in parallel.
- ✅ Centralized error normalization — services receive plain `Error` objects with `.status` and `.data`.
- ✅ `API_BASE_URL` resolved via `import.meta.env.VITE_API_URL` with `/api` fallback.
- ✅ `USE_MOCK` flag exposed via `VITE_USE_MOCK` (default `true`).
- ❌ The `httpClient` is **exported but never called**. Every service body reads mock arrays. The two-phase switch is currently configured in declarations but not in execution.

**API contract mismatches detected:**

| Frontend call | API.md endpoint | Mismatch |
| --- | --- | --- |
| `reviewService.create({ taskId, reviewerId, note })` | `POST /api/tasks/:taskId/review { note }` | Frontend sends `reviewerId`; API.md doesn't show it. |
| `taskService.updateStatus(id, status)` | `PATCH /api/tasks/:id/status { status }` | Aligns. |
| `taskService.assign(id, assigneeId)` | `PATCH /api/tasks/:id/assignee { assigneeId }` | Aligns. |
| `taskService.update({ priority })` | `PATCH /api/tasks/:id/priority` | Frontend folds this into `update`; backend splits it. PATCH vs PUT not in body — resolves if backend accepts partial updates. |
| `notificationService.markAllAsRead()` | `PATCH /api/notifications/read-all` | Aligns. |
| `authService.login({ email, password })` | `POST /api/auth/login { email, password }` | Aligns. |
| `authService.logout()` | `POST /api/auth/logout` | Aligns. |
| `fileService.upload(...)` | `POST /api/files/upload` | **Missing on frontend.** |

**Verdict:** The HTTP plumbing is correct. The only call-by-call mismatch is the review submission's `reviewerId` field. Either the backend accepts it (recommended — it removes the awkward "auto-pick" fallback) or the frontend strips it before sending.

---

## 5. Authentication Audit

**Storage:** `localStorage` keys `pct_auth_user` (full user object) and `pct_auth_token` (opaque token).

**Login flow** (`authService.login`):

1. Receives `{ email, password }`.
2. Tries `mockUsers.find(u => u.email === email)` — if found, returns `ok({ user, token: 'mock-token-<userId>' })`.
3. If not found, falls back to `currentUser` (mockUsers[0], Ahmed Dawood) — **security flaw**: any login attempt with an unrecognized email succeeds as the default admin.
4. Persists user + token to `localStorage`.

**MFA / rate limiting:** None. Documented in SECURITY.md §25-26 as required for the backend.

**Logout:** Clears `localStorage` and returns `ok({ success: true })`. No server call.

**`getCurrentUser`:** Reads from `localStorage` (`pct_auth_user`). No network call.

**`AuthContext`:** Memoizes `{ user, isAuthenticated, login, logout, setUser }`. `setUser` is exposed so other services can update the active user (e.g., after a profile edit).

**Gaps vs AUTHENTICATION.md:**

| Doc recommendation | Frontend reality | Action |
| --- | --- | --- |
| HttpOnly Secure SameSite cookie | localStorage `pct_auth_token` | Backend must set a cookie; frontend must not persist the token in `localStorage`. The Authorization header can still carry it as a defense-in-depth. |
| bcrypt / Argon2 hashing | No passwords at all | Backend owns this. |
| CSRF token for cookie auth | None | Backend must implement; frontend must echo from cookie. |
| Rate limiting on login | None | Backend. |
| Session timeout | None | Documented in `settingsService.getSessions` — which generates mock sessions from `pct_auth_token`. |
| Concurrent session management | Mock list | Backend must implement. |

**Verdict:** The frontend's auth surface is **shaped correctly** for a token transition. The bearer-token header is the right primitive. Moving to a cookie is a backend decision; the frontend does not need to change shape — only the storage location.

---

## 6. CRUD Completeness

| Module | list | get | create | update | remove | status / assign | extra |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Users | ✅ | ✅ | ✅ | ✅ | (deactivate / changeStatus) | (changeRole) | self-protection rules |
| Projects | ✅ | ✅ | ✅ | ✅ | ✅ | (addMember / removeMember) | stats |
| Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | (updateStatus / assign) | projectTasks, myTasks, stats |
| Reviews | ✅ | ✅ | ✅ | ✅ | ✅ | (start / approve / requestRevision / resubmit / assign) | stats |
| Comments | ✅ | — | ✅ | — | ✅ | — | scope: listForTask |
| Notifications | ✅ | ✅ | — | — | ✅ | mark-as-read | stats, unread count, mark all |
| Files | ✅ | — | ❌ (no upload) | — | ✅ | — | scope: listForTask, listForProject |
| Activity | ✅ | ✅ | — | — | — | — | stats, filter options |
| Reports | — | — | — | — | — | — | Read-only derived stats |
| Settings | — | — | — | ✅ (preferences, profile, password) | — | session mgmt | preferences, profile, password, sessions, system |

**Gaps:**

- **File upload** is the only missing CRUD primitive. The frontend has no upload UI and no service method. The file-management UI is currently consume-only.
- **Comments** lack `update` — edits are not supported. This matches API.md (`POST .../comments` and `DELETE .../comments/:id` only), so it's intentional.
- **Settings** has no `list` — preferences are scoped to the current user by design.

All other CRUD surfaces are complete.

---

## 7. Cross-Module Dependencies

The frontend has a clean dependency graph:

```
authService ──► AuthContext (root layout)
                 └─► all permission-gated routes
mockData ──► every service module
activityHelpers ──► every mutation service
              └─► ActivityContext (pub/sub)
                NotificationContext (buffered)
```

**Activity pub/sub pattern:**

- `subscribeActivityChange(cb)` registers a callback.
- `notifyActivityChange()` fires after every `recordActivity()` call.
- `ActivityContext` subscribes once and refetches the activity feed + stats.
- Indirect subscribers (Dashboard, NotificationContext) re-derive their data from the live mock arrays.

**Notification scaffolding:**

- `notificationService` is **not** wired to activity events. The mock data has 19+ notification entries but no service emits a new notification when, e.g., a review is submitted. The frontend's `notificationService` provides CRUD, but the cross-link between activity and notifications is **incomplete** — the `recordActivity()` helper does not call `notificationService.create()`.

**Implication:** Notifications are populated only by mock data today. When wired to the backend, the backend will own generating notifications from activity events. Frontend does not need to wire this.

**Cross-module flows that DO work end-to-end:**

- `taskService.updateStatus(taskId, IN_REVIEW)` → emits `TASK_STATUS_CHANGED` activity.
- `reviewService.create` → calls `taskService.updateStatus` → emits both `TASK_SUBMITTED` (review side) and `TASK_STATUS_CHANGED` (task side) activities.
- `userService.changeRole` → emits `USER_ROLE_CHANGED` activity.
- `commentService.add` → emits `COMMENT_CREATED` activity.

---

## 8. Hardcoded Data

- **All operational data** is in `mockData.js`. There is no hardcoded business data in components or pages.
- **Roles, statuses, permissions, action types** are constants in `utils/constants.js` and `utils/permissions.js`. Reused everywhere.
- **Date / number formatting** lives in `utils/formatDate.js` (132 lines) and `utils/csvExport.js` (48 lines).
- **Icons** are inline SVGs in `components/ui/Icon.jsx` (194 lines). No external icon library.
- **Chart components** in `components/charts/` and `components/reports/` use the seeded data; no static analytics.

**No hardcoded secrets, no hardcoded credentials, no hardcoded API keys.**

---

## 9. State Management

The frontend uses **React state + Context + custom hooks** (per CLAUDE.md §23). No Redux / Zustand / Jotai.

**Contexts:**

- `AuthContext` — current user, login/logout, setUser.
- `ActivityContext` — paginated activity feed, stats, filter options, refresh().
- `NotificationContext` — notifications, unread count, mark-read helpers.

**Hooks:**

- `useAsync(fn, deps)` — generic async wrapper with `data`, `loading`, `error`, `refetch`.
- `useAuth()` — wraps AuthContext.
- `useActivity()` — wraps ActivityContext.
- `useToast()` — wraps the Toast service.

**Concurrent state rules observed:**

- `useAsync` uses a `fnRef` to avoid re-firing on every render.
- Refetch is triggered by `refreshKey` props (e.g., ReviewQueuePage bumps after a create).
- Live refresh via `subscribeActivityChange` is centralized in ActivityContext.

**Verdict:** The state model is simple and stable. The hooks will not need to change when the backend is wired in — only the `fn` they call changes.

---

## 10. Error Handling

- `api.js` exports `fail(message, status)` that returns a rejected promise with `Error.message` and `Error.status`.
- `api.js` response interceptor normalizes axios errors to plain `Error` with `.status` and `.data`.
- Every service uses `fail()` for known error conditions and surfaces them via the rejected promise.
- `useAsync` catches errors and sets `error` state; consumers branch on it.
- Toast container is mounted at the layout root (`AppLayout.jsx`) — appears on every protected page.

**Observation:** There is no global error boundary for unhandled render errors. The 403 / 404 / 500 cases are handled via `authService` (401 ⇒ logout + redirect) and `<PermissionRoute>` (403 ⇒ ForbiddenPage).

**Verdict:** Adequate for the frontend. The backend will be the canonical gatekeeper.

---

## 11. Loading / Empty / Error States

The frontend ships a `LoadingState`, `EmptyState`, and `ErrorState` UI primitive set in `components/ui/`. Every list page imports them. Hot spots:

- `TasksListPage`, `ProjectsListPage`, `ReviewsListPage`, `UsersListPage`, `NotificationsPage`, `ActivityPage`, `ReportsPage` — all use the same trio.

**Verification:** UI has explicit loading/empty/error render paths. No "blank flash" while hydrating.

---

## 12. Permission Coverage

`utils/permissions.js` defines a 27-key permission matrix:

| Module | Keys |
| --- | --- |
| Project | `project.view`, `project.create`, `project.update`, `project.changeStatus`, `project.manageMembers`, `project.archive` |
| Task | `task.view`, `task.create`, `task.update`, `task.assign`, `task.changeStatus`, `task.submitReview`, `task.delete` |
| Review | `review.view`, `review.submit`, `review.start`, `review.approve`, `review.requestRevision`, `review.assign` |
| File | `file.view`, `file.upload`, `file.download`, `file.delete` |
| Report | `report.view`, `report.export`, `report.viewTeam`, `report.viewAll` |
| Activity | `activity.view` |
| Notification | `notification.view`, `notification.markRead`, `notification.manage` |
| User | `user.view`, `user.create`, `user.update`, `user.changeRole`, `user.disable` |
| Settings | `settings.view`, `settings.manage` |

**Cross-check vs ROLE_PERMESSIONS.md:**

- The matrix matches §12-22 of the document.
- All keys follow `resource.action` naming.
- All keys are wired into routes via `<PermissionRoute permission="...">` and via `hasPermission(user, '...')` helpers inside components.

**Authorization principle:** API.md §21 and CLAUDE.md §13 are explicit: hiding a button is not a security mechanism. The backend must independently enforce the same keys. The frontend is correct in enforcing visibility.

**Self-protection rules in `userService.js`:**

- Cannot change own role (else 403).
- Cannot deactivate self (else 403).
- Last active admin cannot be demoted (else 409).
- Email must be unique (else 409).

These must be **re-implemented on the backend** (the frontend's checks are for UX only — they prevent the button from being clickable, but the backend must reject malicious requests).

---

## 13. Route Mapping

`client/src/routes/AppRoutes.jsx` defines 22 routes. Cross-check against `docs/ROUTES.md`:

| Frontend route | Doc route | Permission |
| --- | --- | --- |
| `/login` | ✅ | public |
| `/forgot-password` | ✅ | public |
| `/session-expired` | ✅ | public |
| `/dashboard` | ✅ | (auth) |
| `/search` | ✅ | (auth) |
| `/projects` | ✅ | `project.view` |
| `/projects/:projectId` | ✅ | `project.view` |
| `/tasks` | ✅ | `task.view` |
| `/tasks/me` | ✅ (implied) | `task.view` |
| `/tasks/:taskId` | ✅ | `task.view` |
| `/tasks/:taskId/review` | ✅ | (task.view + review.submit) |
| `/reviews` | ✅ | `review.view` |
| `/reviews/:reviewId` | ✅ | `review.view` |
| `/notifications` | ✅ | `notification.view` |
| `/activity` | ✅ | `activity.view` |
| `/reports` | ✅ | `report.view` |
| `/users` | ✅ | `user.view` |
| `/users/:userId` | ✅ | `user.view` |
| `/developers` | ✅ | (auth) |
| `/developers/:developerId` | ✅ | (auth) |
| `/profile` | ✅ | (auth) |
| `/settings` | ✅ | `settings.view` |
| `/settings/roles` | ✅ | `user.view` |
| `/403` | ✅ | public |
| `*` (catch-all) | ✅ | public |

**Discrepancies:**

- ROUTES.md documents `/tasks/:taskId/review` and `/developers/:developerId` as protected but doesn't assign explicit permission keys. The frontend uses role-based gates.

**Verdict:** All routes are documented and protected. No frontend-only routes leak into the backend surface.

---

## 14. Environment Configuration

`client/vite.config.js`:

```js
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': './src',
      '@components': './src/components',
      '@pages': './src/pages',
      '@services': './src/services',
      '@hooks': './src/hooks',
      '@context': './src/context',
      '@utils': './src/utils',
      '@mock': './src/mock',
      '@assets': './src/assets',
      '@layouts': './src/layouts',
    },
  },
  server: { port: 5173 },
  build: { outDir: 'dist', sourcemap: false },
});
```

**`.env.example` does NOT exist.** Frontend env vars are referenced via `import.meta.env`:

- `VITE_API_URL` — API base URL (defaults to `/api`).
- `VITE_USE_MOCK` — defaults to `true`. Set to `false` to switch to real backend.

**Gap:** There is no example file documenting these two vars. This is a process gap — should be added before handoff, but does not block development.

**Other env:**

- `package.json` scripts: `dev` (vite), `build` (vite build), `preview` (vite preview).
- `node_modules` is installed (axios, react, react-dom, react-router-dom, clsx, vite, tailwindcss, autoprefixer, postcss).

**Verdict:** Build pipeline is functional. Environment contract is implicit; the gap is documentation, not code.

---

## 15. Database Dependency

The frontend does **not** depend on MySQL. All data is sourced from the in-memory `mockData.js`. The boundary is `client/src/services/api.js` (HTTP client) — currently unused.

**What the backend must provide:**

1. `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` IDs (DATABASE.md §6) — currently the frontend uses string IDs (`u_1`, `t_1041`).
2. snake_case fields (`created_at`, `updated_at`, `project_id`, `assigned_to`, `reviewer_id`, `last_login_at`, `due_date`) — frontend uses camelCase.
3. Real `password_hash` — currently absent from mock users.
4. Soft-delete via status (INACTIVE / ARCHIVED) — the frontend already understands these.

**Adapter strategy:** The API edge should normalize both directions. The frontend does not need to change its camelCase — the backend or a thin `apiClient` mapper normalizes payloads at the boundary.

---

## 16. Security Surface

**Frontend exposure:**

- ✅ No secrets in source. No API keys. No hardcoded credentials.
- ✅ `clsx` for class names — no `dangerouslySetInnerHTML` use cases in the audited source.
- ✅ Input validation in every form (regex for email, length checks, role/status constraints).
- ❌ Token in `localStorage` — exposed to XSS. Must move to HttpOnly cookie.
- ❌ No CSRF token — required for cookie auth (SECURITY.md §12).
- ❌ No content security policy — recommended (SECURITY.md §21).
- ❌ User role is trusted in `<PermissionRoute>` — backend must independently reject (API.md §21).

**Password handling:** The frontend has a `changePassword` method in `settingsService.js` but it operates on the mock — the backend will own hashing.

**File upload:** None on frontend. When added, the backend must validate MIME, size, filename (SECURITY.md §5 / DATABASE.md §29).

**Verdict:** The frontend's security surface is acceptable for an internal CRM. The XSS surface from localStorage storage of the token is the main concern, and the backend can resolve it by issuing an HttpOnly cookie alongside (or instead of) the bearer token.

---

## 17. File / Storage

- `fileService.js` exposes `listForTask`, `listForProject`, `list`, `remove` — 32 lines.
- No upload method. **No upload UI.**
- `mockFiles` has 6 entries with `originalName`, `storedName`, `path`, `size`, `mimeType`, `uploadedBy`, `entityType`, `entityId`, `createdAt`.

**Gap:** File upload must be added to both:
1. `fileService.upload(formData, { onProgress })` calls `POST /api/files/upload` with `multipart/form-data`.
2. The UI surfaces (TaskDetail, ProjectDetail) get an upload affordance.

**Backend expectation:** Secure storage on Hostinger filesystem (`/uploads/tasks/`, `/uploads/projects/`, etc.) — see DATABASE.md §27.

**Verdict:** Frontend is read-only for files. The upload path is a known gap that can be added in Phase 2.

---

## 18. Testing Infrastructure

No formal test framework is installed. There is no `vitest`, `jest`, `@testing-library`, or `playwright` in `package.json`. There are no `*.test.js` or `*.spec.js` files in `client/src`.

**Existing test artifacts:**

- `client/reports/dashboard-sync-report.md` — manual verification report.
- `client/reports/users-verify-report.md` — manual verification report.
- `client/reports/reviews-add-report.md` — manual verification report with a jiti-based `test_reviews_add.mjs` harness.

**Implication:** The frontend relies on manual end-to-end verification. The existing report-driven tests (e.g., for `reviewService.create()`) confirm only the **service-layer** behavior; UI rendering and integration are not auto-tested.

**Verdict:** **No automated test suite.** For Phase 2 backend implementation, this is acceptable short-term, but the backend team should plan to add at least API-level integration tests (curl / supertest) and ideally a Playwright smoke for the auth flow.

---

## 19. Build / Runtime

- `npm run dev` — Vite 5.4.21 dev server on port 5173.
- `npm run build` — Vite production build to `dist/`.
- `npm run preview` — Vite preview server.

**Frontend dependencies (`package.json`):**

```json
{
  "dependencies": {
    "axios": "^1.19.0",
    "clsx": "^2.1.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.7.0",
    "autoprefixer": "^10.5.4",
    "postcss": "^8.5.26",
    "tailwindcss": "^3.4.19",
    "vite": "^5.4.21"
  }
}
```

**No backend dependencies.** No Express, no MySQL driver, no JWT, no bcrypt, no cookie-parser. The frontend is decoupled from the backend stack.

**Build output:** `dist/` directory with a single bundle (around 590KB per the recent `reviews-add-report.md`).

**Verdict:** Build is clean, runtime is Node + Vite. No coupling to backend choices.

---

## 20. Backend Migration Map

This is the section that the implementer should mirror exactly when Phase 2 begins.

### 20.1 Endpoint wiring

For every service method, the backend must add a route:

| Frontend call | Method | Path |
| --- | --- | --- |
| `authService.login` | POST | `/api/auth/login` |
| `authService.logout` | POST | `/api/auth/logout` |
| `authService.getCurrentUser` | GET | `/api/auth/me` |
| `userService.list` | GET | `/api/users` |
| `userService.get` | GET | `/api/users/:id` |
| `userService.create` | POST | `/api/users` |
| `userService.update` | PUT | `/api/users/:id` |
| `userService.changeRole` | PATCH | `/api/users/:id/role` |
| `userService.changeStatus` | PATCH | `/api/users/:id/status` |
| `userService.developers` | GET | `/api/users/developers` |
| `userService.workload` | GET | `/api/users/workload` |
| `userService.stats` | GET | `/api/users/stats` |
| `projectService.list` | GET | `/api/projects` |
| `projectService.get` | GET | `/api/projects/:id` |
| `projectService.create` | POST | `/api/projects` |
| `projectService.update` | PUT | `/api/projects/:id` |
| `projectService.remove` | DELETE | `/api/projects/:id` |
| `projectService.addMember` | POST | `/api/projects/:id/members` |
| `projectService.removeMember` | DELETE | `/api/projects/:id/members/:userId` |
| `projectService.stats` | GET | `/api/projects/stats` |
| `taskService.list` | GET | `/api/tasks` |
| `taskService.get` | GET | `/api/tasks/:id` |
| `taskService.create` | POST | `/api/tasks` |
| `taskService.update` | PUT | `/api/tasks/:id` |
| `taskService.updateStatus` | PATCH | `/api/tasks/:id/status` |
| `taskService.assign` | PATCH | `/api/tasks/:id/assignee` |
| `taskService.remove` | DELETE | `/api/tasks/:id` |
| `taskService.stats` | GET | `/api/tasks/stats` |
| `taskService.projectTasks` | GET | `/api/tasks/project/:projectId` |
| `taskService.myTasks` | GET | `/api/tasks/my` |
| `reviewService.list` | GET | `/api/reviews` |
| `reviewService.get` | GET | `/api/reviews/:id` |
| `reviewService.create` | POST | `/api/tasks/:taskId/reviews` (or `/api/reviews`) |
| `reviewService.start` | POST | `/api/reviews/:id/start` |
| `reviewService.approve` | POST | `/api/reviews/:id/approve` |
| `reviewService.requestRevision` | POST | `/api/reviews/:id/revision` |
| `reviewService.resubmit` | POST | `/api/reviews/:id/resubmit` |
| `reviewService.assign` | PATCH | `/api/reviews/:id/reviewer` |
| `reviewService.remove` | DELETE | `/api/reviews/:id` |
| `reviewService.stats` | GET | `/api/reviews/stats` |
| `commentService.*` | GET / POST / DELETE | `/api/tasks/:taskId/comments[/:commentId]` |
| `notificationService.*` | GET / PATCH / DELETE | `/api/notifications[/:id]` |
| `activityService.*` | GET | `/api/activity[/:id]` |
| `reportService.*` | GET | `/api/reports/*` |
| `settingsService.*` | GET / PUT | `/api/settings/*` |
| `fileService.list` | GET | `/api/files?entityType=…&entityId=…` |
| `fileService.remove` | DELETE | `/api/files/:id` |
| `fileService.upload` | POST | `/api/files/upload` ⚠️ **missing on frontend** |

### 20.2 Nomenclature harmonization

| Concept | Frontend | DATABASE.md | Resolved |
| --- | --- | --- | --- |
| Task status | `TODO` | `ASSIGNED` | One must change. Recommend `TODO` (rename in DB schema, since `ASSIGNED` is distribution-gameable and `TODO` is the actual product surface). |
| Task status | `IN_REVIEW` | `REVIEW` | Frontend uses `IN_REVIEW` to disambiguate from `REVIEW_STATUS.IN_REVIEW`. Recommend DB rename `REVIEW` → `IN_REVIEW` for parity. |
| Task status | `BLOCKED` | (not in DB) | Decide: keep on frontend, add to DB. |
| Task status | `CANCELLED` | (not in DB) | Decide: keep on frontend, add to DB. |
| Review status | `SUBMITTED`, `IN_REVIEW`, `APPROVED`, `REVISION_REQUIRED`, `RESUBMITTED` | `APPROVED`, `REVISION_REQUIRED` | DB must expand to include all 5. |
| User status | `ACTIVE`, `INACTIVE`, `SUSPENDED` | `ACTIVE`, `INACTIVE` | Add `SUSPENDED` to DB. |
| ID format | `u_1`, `t_1041` | `BIGINT UNSIGNED AUTO_INCREMENT` | Backend issues integers; frontend maps to string for display. |
| Field naming | `camelCase` | `snake_case` | Adapter at API edge. |

### 20.3 Adapter approach

The cleanest path is for the backend to **talk snake_case** and the frontend to keep **camelCase**, with a thin mapping in `api.js` (or a new `client/src/services/serializers.js`) that transforms:

- **Request body**: `camelCase → snake_case` per resource.
- **Response body**: `snake_case → camelCase` per resource.

This keeps the frontend's existing enum constants (`TASK_STATUS.IN_REVIEW`) and the mock data's camelCase shape intact, while the backend implements the schema as documented.

### 20.4 Phase 2 implementation order

1. **Backend schema** — create the 9 core tables (DATABASE.md §61), expand review statuses to 5, expand task statuses to 8, add `SUSPENDED` to user status.
2. **Auth APIs** — `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`. Backend issues HttpOnly cookie + bearer token.
3. **CRUD APIs** — work through the migration map in module order: users, projects, tasks, reviews, comments, files, notifications, activity, reports, settings.
4. **Backend permission middleware** — re-implement the 27-key permission matrix.
5. **Frontend switch** — flip `USE_MOCK=false`, replace each service body with `httpClient.get(...)` calls. The `ok()` / `fail()` shape stays the same.
6. **Field adapter** — add response/request snake_case ↔ camelCase transforms.
7. **Notification generation** — backend should auto-generate notifications from activity events (frontend doesn't emit them).
8. **File upload** — add frontend upload UI + service method; backend's `POST /api/files/upload` validates and stores.

---

## 21. Final Readiness Score

**Verdict: READY WITH MINOR PREPARATION.**

| Category | Status | Notes |
| --- | --- | --- |
| Service layer | ✅ | All 14 services follow the same envelope. |
| Mock data | ✅ | Single source, well-shaped, internally consistent. |
| API readiness | ⚠️ | HTTP client ready; service bodies still read mock. |
| Authentication | ⚠️ | localStorage; needs HttpOnly cookie — backend-implemented. |
| CRUD completeness | ⚠️ | All present except file upload. |
| Cross-module dependencies | ✅ | Activity pub/sub centralized. |
| Hardcoded data | ✅ | None beyond mock. |
| State management | ✅ | React + Context, no external stores. |
| Error handling | ✅ | Centralized; HTTP errors normalize. |
| Loading/Empty/Error states | ✅ | UI primitives everywhere. |
| Permission coverage | ✅ | 27 keys, all hooked. |
| Route mapping | ✅ | All 22 routes documented + protected. |
| Environment configuration | ⚠️ | No `.env.example`; documented implicitly. |
| Database dependency | ✅ | Mock-only; no current MySQL coupling. |
| Security surface | ⚠️ | Token in localStorage; otherwise clean. |
| File / Storage | ⚠️ | Read-only; no upload. |
| Testing infrastructure | ❌ | No automated tests. |
| Build / Runtime | ✅ | Vite + Tailwind + React 18.3.1. |
| Backend migration map | ✅ | Documented above. |

### Known gaps (must be addressed before / during Phase 2)

1. **Nomenclature harmonization** — task statuses (ASSIGNED → TODO, REVIEW → IN_REVIEW), review status (expand to 5), user status (add SUSPENDED).
2. **API contract** — review submission accepts `reviewerId`; ensure backend contract includes it.
3. **Auth storage** — move `pct_auth_token` from localStorage to HttpOnly cookie (backend-driven).
4. **Field naming** — adapter at the API edge for snake_case ↔ camelCase.
5. **File upload** — add frontend service + UI.
6. **Notification generation** — backend emits notifications from activity events.
7. **`.env.example`** — document `VITE_API_URL` and `VITE_USE_MOCK`.
8. **No automated tests** — acceptable for now; plan Phase 2 supertest/curl-based integration tests.

### What is NOT a gap

- Frontend service shape is already aligned with the documented response envelope (`{ success, data, message }`).
- Frontend permission matrix already matches the documented backend permission set.
- Frontend routes already match the documented backend routes (except review submission's optional `reviewerId`).
- Frontend activity event names already match the documented `ACTIVITY_LOG` action set.
- Frontend task lifecycle is fully captured in the mock (8 statuses are exercised).

---

## 22. Closing Notes

This audit confirmed that the PCT frontend was built with a deliberate Phase 1 / Phase 2 split. The Phase 2 work is **not a rewrite** — it is a body-replacement of 14 service method bodies plus a small field-shape adapter. The structural decisions (route protection, permission gates, response envelope, activity pub/sub, status constants) are already in place and aligned with the documentation.

The most consequential reconciliation items are:

- **Task status rename** (ASSIGNED → TODO, REVIEW → IN_REVIEW) — should be done in `DATABASE.md` first, then propagated to the DB schema, then to the frontend's `TASK_STATUS` const.
- **Review status expansion** — `SUBMITTED`, `IN_REVIEW`, `REVISION_REQUIRED`, `RESUBMITTED`, `APPROVED` all need to land in the DB schema.
- **API contract extension** — `POST /api/tasks/:taskId/reviews` should accept an optional `reviewerId` so the frontend can pre-select a reviewer (matches `reviewService.create({ taskId, reviewerId, note })`).
- **Auth storage** — backend issues HttpOnly cookie; frontend reads `/api/auth/me` on mount instead of `localStorage`.

Once those are addressed, the frontend can be wired to the real backend by a single configuration change (`VITE_USE_MOCK=false`) plus the body replacements.

— End of audit —
