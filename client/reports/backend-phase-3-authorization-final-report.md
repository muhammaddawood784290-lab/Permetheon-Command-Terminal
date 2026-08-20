# Backend Phase 3 — Authorization + Roles & Permissions — Final Report

> **Status:** COMPLETE — 143 / 143 assertions PASS in both `development` and `production` modes.
> **Date:** 2026-08-12
> **Scope:** Server-side authorization layer on top of the Phase 2 authentication foundation. Frontend source was **NOT** modified by this phase.

---

## 1. Scope

Phase 3 ships the authorization layer that answers *"What is this user allowed to do?"* after Phase 2's authentication answers *"Who is this user?"*

**In scope (delivered):**
- Centralized permission matrix (single source of truth).
- `requirePermission(permission)` Express middleware.
- `requireRole(...roles)` Express middleware (for genuinely role-specific operations).
- 401 vs 403 separation per RFC 7235 / SECURITY.md §31–32.
- Defense-in-depth: ignore all client-supplied role / permission fields.
- Integration with stub routes via `/api/authz` smoke surface.
- 143-assertion test harness covering the 16-item minimum suite + a full permission-matrix sweep.
- Dev mode (`:5000`) and prod mode (`:5001`) verified against live MySQL on XAMPP.

**Out of scope (deferred to later phases):**
- Users CRUD, Projects CRUD, Tasks CRUD, Reviews CRUD, Notifications, Activity, Reports, Settings, Files business logic.
- Resource-level scope (project membership / task assignment). That lands with the modules where Projects / Tasks / Reviews are implemented.
- Permission-management database. Permissions are application code per ROLE_PERMESSIONS.md §36.
- Token refresh, account lockout, password reset, CSRF tokens.
- Any frontend change.

---

## 2. Roles

Per ROLE_PERMESSIONS.md §3 and CLAUDE.md §12, PCT V1 has three roles. No additional roles were invented.

| Role        | Primary Responsibility                          |
| ----------- | ----------------------------------------------- |
| ADMIN       | Full system administration                      |
| TEAM_LEAD   | Development team and project management         |
| DEVELOPER   | Development work and assigned tasks             |

These are exported from `server/src/utils/permissions.js` as the frozen `ROLE` constant and validated against `ALL_ROLES` on any role check.

---

## 3. All 34 Canonical Permissions

Per ROLE_PERMESSIONS.md §49 and `client/src/utils/permissions.js`, the canonical V1 vocabulary uses `resource.action` notation with camelCase compound actions. The full list, exported as `ALL_PERMISSIONS` from `server/src/utils/permissions.js`:

| Group        | Permissions |
| ------------ | ----------- |
| Projects     | `project.view`, `project.create`, `project.update`, `project.delete`, `project.archive`, `project.manageMembers` |
| Tasks        | `task.view`, `task.create`, `task.update`, `task.delete`, `task.assign`, `task.changeStatus` |
| Reviews      | `review.view`, `review.submit`, `review.start`, `review.approve`, `review.requestRevision`, `review.assign` |
| Files        | `file.upload`, `file.download`, `file.delete` |
| Reports      | `report.view`, `report.export` |
| Activity     | `activity.view` |
| Notifications| `notification.view`, `notification.markRead`, `notification.manage` |
| Users        | `user.view`, `user.create`, `user.update`, `user.disable`, `user.changeRole` |
| Settings     | `settings.view`, `settings.update` |

**Total: 34 keys** (matches `client/src/utils/permissions.js` and ROLE_PERMESSIONS.md §49 verbatim). The Phase 3 brief referenced "27" — that count is a documentation mismatch; Phase 3 locks the 34-key set as authoritative. No new keys were introduced.

`isKnownPermission(key)` is used by middleware to fail closed if a route ever asks for an unknown permission (server-side bug, never a client fault).

---

## 4. Role → Permission Matrix

Mirrors `client/src/utils/permissions.js` and ROLE_PERMESSIONS.md §22.

| Permission                | ADMIN | TEAM_LEAD | DEVELOPER |
| ------------------------- | :---: | :-------: | :-------: |
| `project.view`            |   ✅   |     ✅     |     ✅     |
| `project.create`          |   ✅   |     ✅     |     ❌     |
| `project.update`          |   ✅   |     ✅     |     ❌     |
| `project.delete`          |   ✅   |     ❌     |     ❌     |
| `project.archive`         |   ✅   |     ✅     |     ❌     |
| `project.manageMembers`   |   ✅   |     ✅     |     ❌     |
| `task.view`               |   ✅   |     ✅     |     ✅     |
| `task.create`             |   ✅   |     ✅     |     ❌     |
| `task.update`             |   ✅   |     ✅     |     ✅     |
| `task.delete`             |   ✅   |     ❌     |     ❌     |
| `task.assign`             |   ✅   |     ✅     |     ❌     |
| `task.changeStatus`       |   ✅   |     ✅     |     ✅     |
| `review.view`             |   ✅   |     ✅     |     ✅     |
| `review.submit`           |   ✅   |     ✅     |     ✅     |
| `review.start`            |   ✅   |     ✅     |     ❌     |
| `review.approve`          |   ✅   |     ✅     |     ❌     |
| `review.requestRevision`  |   ✅   |     ✅     |     ❌     |
| `review.assign`           |   ✅   |     ❌     |     ❌     |
| `file.upload`             |   ✅   |     ✅     |     ✅     |
| `file.download`           |   ✅   |     ✅     |     ✅     |
| `file.delete`             |   ✅   |     ✅     |     ❌     |
| `report.view`             |   ✅   |     ✅     |     ❌     |
| `report.export`           |   ✅   |     ✅     |     ❌     |
| `activity.view`           |   ✅   |     ✅     |     ✅     |
| `notification.view`       |   ✅   |     ✅     |     ✅     |
| `notification.markRead`   |   ✅   |     ✅     |     ✅     |
| `notification.manage`     |   ✅   |     ❌     |     ❌     |
| `user.view`               |   ✅   |     ✅     |     ❌     |
| `user.create`             |   ✅   |     ❌     |     ❌     |
| `user.update`             |   ✅   |     ❌     |     ❌     |
| `user.disable`            |   ✅   |     ❌     |     ❌     |
| `user.changeRole`         |   ✅   |     ❌     |     ❌     |
| `settings.view`           |   ✅   |     ✅     |     ✅     |
| `settings.update`         |   ✅   |     ❌     |     ❌     |

Resource-level scope (project membership, task assignment, reviewer identity) is layered on top of this matrix in Phase 4+ controllers.

---

## 5. Middleware Implementation

### `server/src/utils/permissions.js` — centralized permission matrix

- `ROLE`, `STATUS`, `ALL_ROLES`, `PERMISSIONS`, `ALL_PERMISSIONS` (frozen exports).
- `hasPermission(user, permission)`, `hasAnyPermission`, `hasAllPermissions`, `getUserPermissions`.
- `isKnownPermission(permission)` — fails closed on unknown keys.

### `server/src/middleware/permissionMiddleware.js` — `requirePermission` + `requireRole`

```js
router.get(
  '/projects',
  requireAuth,                  // Phase 2: 401 if missing/invalid session
  requirePermission('project.view'),  // Phase 3: 403 if role lacks permission
  projectsController.list,
);
```

**Invariants enforced by the middleware:**

1. **Always mounted after `requireAuth`.** `requirePermission` reads `req.user.role` populated by `requireAuth` from the DB-backed session. If `req.user` is missing the middleware throws a server-side wiring error at request time — not a 403.
2. **Never trusts client-supplied role / permission fields.** Body `role`, headers `X-Role`, body `permissions` — all ignored. Only `req.user.role` (DB-backed) is consulted.
3. **Unknown permission key fails closed at mount time.** Calling `requirePermission('foo.bar')` throws immediately when the router module loads, so a typo never becomes an open door.
4. **403 envelope is the standard `ApiError.forbidden('...', 'FORBIDDEN')`** — goes through `errorHandler` to match `{success:false, message, error:{code}}`.
5. **Always 403 for permission failures, never 401.** 401 is the responsibility of `requireAuth`. The two are never confused.
6. **Server-side logging on every 403.** `[METHOD URL] forbidden user=<id> role=<role> perm=<key>` is logged via `logger.warn`. The log line carries no password / token / secret.

`requireRole(...roles)` follows the same shape and is exported alongside `requirePermission`. It exists for genuinely role-specific operations; the brief and CLAUDE.md both prefer `requirePermission` whenever a documented capability exists.

---

## 6. Route Integration

### `/api/authz` — Phase 3 authorization smoke surface

A new `server/src/routes/authzRoutes.js` exposes one endpoint per canonical permission, each mounted as `requireAuth + requirePermission(<key>) + handler`. The handler returns `{success:true, allowed:true, permission, userId, role}`.

Example: `GET /api/authz/projects/view` requires `project.view`. A developer succeeds, a developer asking for `user.create` is denied with 403.

### Stub mounts

The existing 9 stub routes (`/api/users`, `/api/projects`, …) had no auth at all in Phase 2. In Phase 3 each stub is wrapped with `requireAuth` first, so unauthenticated callers see 401 (not the legacy 501). The 501 itself is preserved — Phase 4+ replaces the handlers.

The `/api/authz` surface is mounted BEFORE the stubs so any matching path lands on the authz route first.

### Version bump

`server/src/routes/index.js` version field: `0.2.0` → `0.3.0`.

---

## 7. Database Changes

**None.** Per ROLE_PERMESSIONS.md §36 and the Phase 3 brief, V1 keeps permissions in application code rather than a permission-management database. The existing `users.role` and `users.status` columns from Phase 1/2 are the only authoritative sources.

---

## 8. Test Users

No new users. The five seeded users from Phase 2 cover all roles plus negative paths. Reused without modification.

| Email                  | Password         | Role      | Status    |
| ---------------------- | ---------------- | --------- | --------- |
| `admin@pct.local`      | `Admin#1234`     | ADMIN     | ACTIVE    |
| `lead@pct.local`       | `Lead#1234`      | TEAM_LEAD | ACTIVE    |
| `dev@pct.local`        | `Dev#1234`       | DEVELOPER | ACTIVE    |
| `inactive@pct.local`   | `Inactive#1234`  | DEVELOPER | INACTIVE  |
| `suspended@pct.local`  | `Suspended#1234` | DEVELOPER | SUSPENDED |

`server/scripts/seed_test_users.js` was not modified.

---

## 9. Development Test Results

`BASE=http://localhost:5000 bash server/scripts/test_authorization.sh`

```
========================================================
PASS: 143    FAIL: 0
========================================================
```

17 cases covering the brief's 16-item minimum suite plus a permission-matrix sweep:

| ID | Case | Result |
| -- | ---- | :----: |
| L  | log in 4 ACTIVE / 2 negative-path users | PASS |
| T01 | Unauthenticated → 401 | PASS |
| T02 | ADMIN can read `project.view` | PASS |
| T03 | TEAM_LEAD can `project.create` | PASS |
| T04 | DEVELOPER can `task.view` | PASS |
| T05 | DEVELOPER denied `user.create` → 403 | PASS |
| T06 | TEAM_LEAD denied `user.create` → 403 | PASS |
| T07 | ADMIN allowed `user.changeRole` | PASS |
| T08 | Valid permission → handler runs | PASS |
| T09 | Unknown authz path → 404 (no unknown perm leaks through) | PASS |
| T10 | Client-supplied `role`/`X-Role` cannot escalate | PASS |
| T11 | Client-supplied `permissions` cannot escalate | PASS |
| T12 | SUSPENDED cannot authorize | PASS |
| T13 | INACTIVE cannot authorize | PASS |
| T14 | No session cookie → 401 | PASS |
| T15 | `requirePermission` does not bypass `requireAuth` | PASS |
| T16 | Error responses do not leak internals | PASS |
| T-matrix | 34 permissions × 3 roles = 102 expected outcomes | 102/102 PASS |

Total: **143/143 assertions pass, 0 fail.**

---

## 10. Production Test Results

`BASE=http://localhost:5001 bash server/scripts/test_authorization.sh` (server started with `NODE_ENV=production PORT=5001 npm start`).

```
========================================================
PASS: 143    FAIL: 0
========================================================
```

Same 143 assertions, identical to dev. Production-specific checks:

- Malformed JSON body sent to `PATCH /api/authz/users/change-role` returns `400` with body `{"success":false,"message":"An unexpected error occurred.","error":{"code":"INTERNAL_ERROR"}}` — no stack trace, no file path, no `node_modules`, no internal error detail leaks.
- `IS_PRODUCTION` guard in `errorHandler.js` strips `details` and `err.stack` before they can reach the client.

---

## 11. Permission Matrix Verification

The full matrix was exercised by the `T-matrix` section of the test harness. For every (permission, role) pair where the matrix above shows ✅ the harness asserts `200 OK`; for every ❌ it asserts `403 FORBIDDEN`. Result: 102/102 outcomes match the documented matrix. Zero deviation.

---

## 12. Security Verification

The Phase 3 brief's required security checks:

| # | Requirement | Result |
| - | ----------- | :----: |
| 1 | Unauthenticated requests return 401, not 403 | PASS — T01 / T14 |
| 2 | Authenticated-but-not-permitted requests return 403, not 401 | PASS — T05, T06, T05b, T06b, T-matrix denied rows |
| 3 | Client-supplied `role` in request body is ignored | PASS — T10 |
| 4 | Client-supplied `X-Role` header is ignored | PASS — T10b |
| 5 | Client-supplied `permissions` field is ignored | PASS — T11 |
| 6 | SUSPENDED accounts cannot authorize | PASS — T12 (login blocked + stale cookie rejected) |
| 7 | INACTIVE accounts cannot authorize | PASS — T13 (login blocked) |
| 8 | Invalid / expired / stale session → 401 | PASS — T12 stale cookie → 401 |
| 9 | `requirePermission` cannot bypass `requireAuth` | PASS — T15 (401 envelope proves auth ran first; unknown route without cookie returns 401, not 403) |
| 10 | Unknown permission key fails closed (never an open door) | PASS — `isKnownPermission` throws at module load if a route ever asks for an unknown key |
| 11 | Production errors do not expose stack traces or internal paths | PASS — direct curl confirmed |
| 12 | No passwords, hashes, tokens, or secrets in any log line | PASS — no logger call carries those; permission-middleware logs only `userId`, `role`, `perm` |
| 13 | Permission matrix on the backend matches ROLE_PERMESSIONS.md §22 and the frontend helper | PASS — 102/102 matrix cells match |
| 14 | No new permissions invented | PASS — `ALL_PERMISSIONS` set is identical to `client/src/utils/permissions.js` |
| 15 | No new roles invented | PASS — `ALL_ROLES` is exactly `{ADMIN, TEAM_LEAD, DEVELOPER}` |
| 16 | No permission-management database introduced | PASS — permissions live in `server/src/utils/permissions.js` per ROLE_PERMESSIONS.md §36 |
| 17 | `req.user.role` is the only role source — no client field can escalate | PASS — T10, T11, T15 |

---

## 13. Bugs Found and Fixed

| # | Where | Symptom | Root cause | Fix |
| - | ----- | ------- | ---------- | --- |
| 1 | `server/src/routes/authzRoutes.js` line 36 | `POST /api/authz/projects/create` returned 404 | Array entry had `method: 'get'` instead of `method: 'post'` | Changed to `'post'`. All 6 project.create matrix assertions now pass. |
| 2 | `server/scripts/test_authorization.sh` T10 / T15 | T10 fired `-X POST` against `users/change-role` (a PATCH route); T15 fired `GET`. Both got 404. | Test harness used the wrong HTTP verb for two endpoints. | Corrected both to `-X PATCH`. |

Both fixes are surgical and do not change the production-facing behavior of the implementation.

---

## 14. Files Created

| Path | Purpose |
| ---- | ------- |
| `server/src/utils/permissions.js` | Centralized role → permission matrix (single source of truth) |
| `server/src/middleware/permissionMiddleware.js` | `requirePermission` + `requireRole` middleware |
| `server/src/routes/authzRoutes.js` | `/api/authz/*` smoke surface — one route per canonical permission |
| `server/scripts/test_authorization.sh` | 143-assertion dev/prod test harness |
| `client/reports/backend-phase-3-authorization-final-report.md` | This file |

## 15. Files Modified

| Path | Change |
| ---- | ------ |
| `server/src/routes/index.js` | Mounted `/authz` route; wrapped each stub with `requireAuth`; bumped version `0.2.0` → `0.3.0` |

No other files in `server/src/` were touched. No `package.json` dependency was added (only Phase 2's `bcryptjs` and `cookie-parser` are still used). No `.env`, no migration, no DB schema change.

---

## 16. Frontend Changes

**Frontend source modified: NO.**

`git diff --stat client/src/` shows only pre-existing modifications from prior work (predating Phase 2 completion, confirmed by the Phase 2 final report). Phase 3 made zero edits under `D:/pct/client/src/`. The frontend permission helper (`client/src/utils/permissions.js`) was used as reference material only.

---

## 17. Development Verification

- Server start: `cd server && npm run dev` → MySQL `pct` connects, `/api/health` returns 200 with `version: "0.3.0"`.
- Harness: `BASE=http://localhost:5000 bash server/scripts/test_authorization.sh` → 143/143 PASS.

## 18. Production Verification

- Server start: `cd server && NODE_ENV=production PORT=5001 npm start` → MySQL `pct` connects, `/api/health` returns 200 with `version: "0.3.0"`.
- Harness: `BASE=http://localhost:5001 bash server/scripts/test_authorization.sh` → 143/143 PASS.
- Error sanitization: malformed JSON body → `400` with `{success:false, message:"An unexpected error occurred.", error:{code:"INTERNAL_ERROR"}}`. No stack, no path, no internal detail.

---

## 19. Remaining Issues

None. All Phase 3 brief requirements are satisfied:

- 16-item minimum test suite → 17 cases (L + T01–T16) PASS.
- Full permission matrix sweep → 102/102 outcomes match.
- Dev mode → 143/143.
- Prod mode → 143/143.
- 17-item security audit → all PASS.
- Frontend untouched.
- No new dependencies.
- No new roles, no new permissions, no new tables.

Resource-level scope (project membership, task assignment, reviewer identity) is intentionally out of scope per the brief and will arrive with Phase 4+ modules where Projects / Tasks / Reviews are implemented.

---

## 20. Final Status

**COMPLETE** — Phase 3 Authorization + Roles & Permissions is delivered and verified end-to-end. Both the development suite (`:5000`) and the production suite (`:5001`) report **143 / 143** assertions passing. Frontend (`D:/pct/client/src/`) was not modified.

| Check | Result |
| ----- | :----: |
| Development tests | **PASS** — 143 / 143 |
| Production tests  | **PASS** — 143 / 143 |
| Security checks   | **PASS** — 17 / 17 |
| Final report      | **CREATED** — this file |
| Phase 3           | **COMPLETE** |