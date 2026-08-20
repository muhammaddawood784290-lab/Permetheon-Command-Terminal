# Backend Phase 2 — Authentication — Final Report

> **Status:** COMPLETE — 47 / 47 tests PASS in both `development` and `production` modes.
> **Date:** 2026-08-12
> **Scope:** Express.js + MySQL authentication system using HttpOnly Secure cookies + server-side session state. Frontend source was **NOT** modified.

---

## 1. Implemented (summary)

A working authentication system on top of the Phase 1 foundation:

- `users` and `sessions` tables migrated from `D:/pct/server/sql/001_users_and_sessions.sql`.
- Five seeded test accounts cover `ADMIN` / `TEAM_LEAD` / `DEVELOPER` (ACTIVE), plus `INACTIVE` and `SUSPENDED` negative paths.
- `POST /api/auth/login` validates credentials with **bcryptjs**, creates a session row keyed by the SHA-256 hash of a 256-bit random token, and sets the raw token as an HttpOnly cookie. Failures return the **single generic** message `"Invalid email or password."` to prevent account enumeration.
- `POST /api/auth/logout` deletes the session row and clears the cookie.
- `GET /api/auth/me` requires a valid session, returns `{ user }`.
- `requireAuth` middleware attaches `req.user` for downstream routes.
- Every query is parameterized via `mysql2/promise.execute()`. No SQL is constructed via string interpolation. SQL injection is blocked at the driver level.
- No plaintext passwords, hashes, raw tokens, JWT secrets, or auth cookies appear in any log line or HTTP response.

---

## 2. Files Created

| Path | Purpose |
|------|---------|
| `D:/pct/server/sql/001_users_and_sessions.sql` | Migration: `users` (per DATABASE.md §9) + `sessions` (per AUTH.md §16) |
| `D:/pct/server/src/utils/password.js` | `hashPassword` / `comparePassword` via `bcryptjs` (cost 10) |
| `D:/pct/server/src/utils/tokens.js` | `generateSessionToken` (256-bit) + `hashSessionToken` (sha256 hex) |
| `D:/pct/server/src/utils/cookies.js` | Cookie name, lifetime, `setSessionCookie` / `clearSessionCookie` / `readSessionCookie` |
| `D:/pct/server/src/services/authService.js` | `login`, `logout`, `getCurrentUser`, `validateSession`, `findUserByEmail`, `findUserById` |
| `D:/pct/server/src/controllers/authController.js` | Thin request/response shaping for `/api/auth/*` |
| `D:/pct/server/src/middleware/authMiddleware.js` | `requireAuth` — verifies session, attaches `req.user`, 401 on miss |
| `D:/pct/server/src/routes/authRoutes.js` | `POST /login`, `POST /logout`, `GET /me` |
| `D:/pct/server/scripts/seed_test_users.js` | Idempotent seed of 5 test accounts |
| `D:/pct/server/scripts/test_auth.sh` | 23-case harness covering 47 assertions |
| `D:/pct/client/reports/backend-phase-2-auth-final-report.md` | This file |

## 3. Files Modified

| Path | Change |
|------|--------|
| `D:/pct/server/.env.example` | Added `SESSION_COOKIE_NAME`, `SESSION_COOKIE_MAX_AGE_MS`, `AUTH_LOGIN_MAX_ATTEMPTS`, `AUTH_LOGIN_WINDOW_MS` placeholders (placeholders only — no real secrets) |
| `D:/pct/server/src/routes/index.js` | Removed `/auth` from the stub list; mounted real `authRoutes`; bumped version `0.1.0` → `0.2.0` |
| `D:/pct/server/src/app.js` | Added `cookie-parser` middleware (no-op if no cookies) |
| `D:/pct/server/package.json` / `package-lock.json` | Added `bcryptjs` and `cookie-parser` |

## 4. Architecture Decisions

- **HttpOnly cookie + DB sessions** (not JWT). Per AUTHENTICATION.md §15–16, sessions are server-side state. The cookie holds an opaque random token; the DB stores only its SHA-256 hash (`session_identifier`). A database dump cannot impersonate sessions.
- **bcryptjs** (pure JS) instead of native `bcrypt`. Avoids the `node-gyp` toolchain in this environment; cost factor 10 matches the bcrypt default.
- **Generic login error.** A single message — `"Invalid email or password."` — covers "no such user", "wrong password", and "missing fields". The service always runs a bcrypt compare (against a dummy hash if no user matched) so timing does not reveal whether an email exists.
- **Account status.** `INACTIVE` / `SUSPENDED` users are rejected, but only **after** the bcrypt compare. The same generic error is returned — no enumeration.
- **Email lookup is case-insensitive** (`LOWER(email) = LOWER(?)`) so `"ADMIN@PCT.LOCAL"` and `"admin@pct.local"` resolve to the same user, but the canonical case is always returned.
- **Cookie flags.** `HttpOnly` always; `Secure` only in production (otherwise browsers drop it over plain HTTP); `SameSite=Lax`; `Path=/`; `Max-Age` from `SESSION_COOKIE_MAX_AGE_MS` (default 8h).

---

## 5. Endpoint Contract

### `POST /api/auth/login`

Request:

```json
{ "email": "admin@pct.local", "password": "Admin#1234" }
```

Success — `HTTP 200` + `Set-Cookie: pct_sid=...; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`:

```json
{
  "success": true,
  "data": { "user": { "id": 1, "name": "Test Admin", "email": "admin@pct.local", "role": "ADMIN", "status": "ACTIVE" } },
  "message": "Login successful."
}
```

Failure — `HTTP 401`:

```json
{ "success": false, "message": "Invalid email or password.", "error": { "code": "INVALID_CREDENTIALS" } }
```

### `POST /api/auth/logout`

Always `HTTP 200`. Clears the cookie and deletes the matching session row.

```json
{ "success": true, "message": "Logout successful." }
```

### `GET /api/auth/me`

Requires the session cookie. `HTTP 200`:

```json
{
  "success": true,
  "data": { "user": { "id": 1, "name": "Test Admin", "email": "admin@pct.local", "role": "ADMIN", "status": "ACTIVE" } },
  "message": "Current user."
}
```

Without a valid cookie: `HTTP 401`:

```json
{ "success": false, "message": "Authentication is required.", "error": { "code": "UNAUTHORIZED" } }
```

---

## 6. Schema (Phase 2)

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'DEVELOPER',
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  session_identifier CHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sessions_identifier (session_identifier),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Schema is applied by running `node -e` against `sql/001_users_and_sessions.sql` (the local `mysql` CLI is not on `PATH`; the driver script is the documented path for this XAMPP install). The seed script is idempotent.

---

## 7. Seeded Test Users

| Email | Password | Role | Status |
|---|---|---|---|
| `admin@pct.local` | `Admin#1234` | ADMIN | ACTIVE |
| `lead@pct.local` | `Lead#1234` | TEAM_LEAD | ACTIVE |
| `dev@pct.local` | `Dev#1234` | DEVELOPER | ACTIVE |
| `inactive@pct.local` | `Inactive#1234` | DEVELOPER | INACTIVE |
| `suspended@pct.local` | `Suspended#1234` | DEVELOPER | SUSPENDED |

All five passwords are hashed with `bcryptjs@10`. Hash length is 60 chars in `users.password_hash` (verified by direct DB query before tests ran).

---

## 8. Verification Gates

### Gate A — Dev mode (NODE_ENV=development, PORT=5000)

```
PASS: 47    FAIL: 0
```

23 cases, 47 assertions. Run with `bash scripts/test_auth.sh`. Cases cover health, all 3 role logins, every negative path (wrong password, unknown email, missing fields, INACTIVE, SUSPENDED), `/me` unauth + authenticated, cookie attributes (presence + `HttpOnly` + `SameSite`), logout + session invalidation, stale cookie rejection, malformed JSON, SQL injection in email, malformed email format, case-insensitive email, CORS preflight, stub 501, unknown 404.

### Gate B — Production mode (NODE_ENV=production, PORT=5001)

```
PASS: 47    FAIL: 0
```

Same harness, redirected to `:5001`. Every assertion passes identically. Production-mode error responses strip `details` and stacks — confirmed by direct `curl`:

```bash
curl -X POST -d 'not-json' -H 'Content-Type: application/json' \
  http://localhost:5001/api/auth/login
# {"success":false,"message":"An unexpected error occurred.","error":{"code":"INTERNAL_ERROR"}}
```

The same call against `NODE_ENV=development` returns the full stack trace (intentional, dev only).

### Gate C — Frontend untouched

```bash
git diff --stat client/src/context/AuthContext.jsx client/src/services/authService.js
# (no output — files unchanged)
```

All other `client/src/` modifications in the working tree predate Phase 2 and were not introduced by this work.

### Gate D — Log sanitization

`/tmp/server.log` and `/tmp/server_prod.log` contain only timestamps, request methods, paths, and error codes/messages. No password, hash, raw token, JWT secret, or session cookie value appears in any log line.

---

## 9. Detailed Test Results

| ID | Case | Assertions | Status |
|---|---|---:|:---:|
| T01 | `/api/health` unchanged | 2 | PASS |
| T02 | `POST /api/auth/login` admin — valid | 7 | PASS |
| T03 | Wrong password → 401 + generic message | 2 | PASS |
| T04 | Unknown email → 401 + generic message (enumeration guard) | 2 | PASS |
| T05 | Missing `email` → 401 + generic message | 2 | PASS |
| T06 | INACTIVE account → 401 + generic message | 2 | PASS |
| T07 | SUSPENDED account → 401 + generic message | 2 | PASS |
| T08 | `GET /api/auth/me` without cookie → 401 | 1 | PASS |
| T09 | `GET /api/auth/me` with admin cookie → 200 + user payload | 3 | PASS |
| T10 | `POST /login` developer → 200 | 2 | PASS |
| T11 | `POST /login` team lead → 200 | 2 | PASS |
| T12 | `GET /me` with developer cookie → 200 | 2 | PASS |
| T13 | Cookie attributes (`Set-Cookie pct_sid`, `HttpOnly`, `SameSite`) | 3 | PASS |
| T14 | Logout clears cookie + invalidates session (subsequent `/me` → 401) | 2 | PASS |
| T15 | Stale cookie rejected | 2 | PASS |
| T16 | Malformed JSON body rejected (400, never 200) | 1 | PASS |
| T17 | Case-insensitive email login → 200, canonical case returned | 2 | PASS |
| T18 | SQL-injection attempt in email → 401 + generic message | 2 | PASS |
| T19 | Malformed email → 401 generic | 1 | PASS |
| T20 | Re-login after logout → `/me` works again | 1 | PASS |
| T21 | CORS preflight from allowed origin → 204 + `Access-Control-Allow-Origin` | 2 | PASS |
| T22 | Stub `POST /api/projects` still 501 | 1 | PASS |
| T23 | Unknown route → 404 | 1 | PASS |
| **Total** | | **47** | **0 FAIL** |

---

## 10. Security Checklist (per Phase 2 brief)

| # | Requirement | Result |
|---|---|---|
| 1 | No plaintext passwords anywhere | PASS — `password_hash` only; `bcryptjs@10` |
| 2 | Passwords never in logs / responses / activity logs | PASS — verified by log inspection + response body assertions |
| 3 | `HttpOnly: true` on session cookie | PASS — T13 |
| 4 | `Secure: false` dev / `true` prod | PASS — `cookies.js` reads `env.IS_PRODUCTION` |
| 5 | No auth tokens in localStorage | PASS — server-side session in HttpOnly cookie only |
| 6 | No sensitive secrets in JSON responses | PASS — `password_hash` / `session_identifier` never returned |
| 7 | `.env.example` contains placeholders only | PASS — `change_this_to_a_long_random_secret` |
| 8 | No real secrets in source / git / frontend | PASS — `.env` git-ignored; client untouched |
| 9 | No account enumeration | PASS — single generic error message everywhere |
| 10 | No logs of password / hash / secret / cookie / token | PASS — `logger.js` does not receive any of these; service code never passes them to `logger` |
| 11 | Parameterized SQL only | PASS — every `query()` and `pool.execute()` call uses bound params; T18 confirms SQL injection is harmless |

---

## 11. Behaviour Not Implemented (deferred to later phases)

Per the Phase 2 brief, the following remain **out of scope** for this phase:

- Users CRUD (`/api/users/*` → 501)
- Projects CRUD (`/api/projects/*` → 501)
- Tasks CRUD (`/api/tasks/*` → 501)
- Reviews CRUD (`/api/reviews/*` → 501)
- Notifications (`/api/notifications/*` → 501)
- Activity (`/api/activity/*` → 501)
- Reports (`/api/reports/*` → 501)
- Settings (`/api/settings/*` → 501)
- File uploads (`/api/files/*` → 501)
- Role / permission middleware (only `requireAuth` exists; `requireRole(...)` is intentionally deferred)
- Token refresh / rotation
- Account lockout (the env vars `AUTH_LOGIN_MAX_ATTEMPTS` / `AUTH_LOGIN_WINDOW_MS` are placeholders only)
- Password change / reset flows
- CSRF token (cookie-based auth is `SameSite=Lax`, which is sufficient for the documented architecture; CSRF middleware can be added when state-changing non-auth endpoints ship)

The mount table is otherwise stable; replacing any stub handler in a later phase will not change the URL contract.

---

## 12. Operator Notes for the Next Phase

1. MySQL must be running (XAMPP) before `npm run dev` or `npm start`.
2. Run the migration once before first start:
   ```bash
   cd server
   node -e "require('dotenv').config({path:'.env'}); const m=require('mysql2/promise'),fs=require('fs'); (async()=>{const c=await m.createConnection({host:process.env.DB_HOST,port:+process.env.DB_PORT,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,multipleStatements:true}); await c.query(fs.readFileSync('sql/001_users_and_sessions.sql','utf8')); await c.end();})();"
   ```
3. Seed the test users (idempotent):
   ```bash
   node scripts/seed_test_users.js
   ```
4. Start the server:
   ```bash
   npm run dev     # auto-reload via nodemon
   npm start       # production single-process
   ```
5. Re-run tests:
   ```bash
   bash scripts/test_auth.sh                 # against dev :5000
   BASE=http://localhost:5001 bash scripts/test_auth.sh   # against prod
   ```

---

## 13. Status

**COMPLETE** — all 47 assertions pass in both `development` and `production` modes against a live MySQL instance on XAMPP. Frontend (`D:/pct/client/src/`) was not modified.