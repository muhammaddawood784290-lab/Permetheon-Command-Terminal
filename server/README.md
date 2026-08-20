# PCT Backend — Server

Phase 1 foundation for the PCT platform: **Express.js + MySQL** running
behind the React (Vite) frontend in `../client`.

This phase is intentionally narrow. It establishes the runtime, the
MySQL connection, the response shape, the error middleware, and the
route surface. **No endpoints beyond `/api/health` are implemented yet.**
All other modules are mounted as `501 Not Implemented` stubs so the
URL contract is stable while later phases fill in the behaviour.

---

## Stack

| Layer       | Choice                                                |
|-------------|-------------------------------------------------------|
| Runtime     | Node.js ≥ 18                                          |
| Framework   | Express 4 (stable; standalone, not in root workspaces)|
| Database    | MySQL 8 (via XAMPP) — `mysql2/promise` connection pool|
| Config      | `dotenv` from `server/.env`                           |
| CORS        | `cors` — explicit `FRONTEND_URL` allowlist (no `'*'`) |
| Dev runner  | `nodemon` for `npm run dev`                           |

---

## Prerequisites

- Node.js 18+ on `PATH`
- XAMPP (or any MySQL 8) running locally with the **MySQL service started**
- A MySQL database named `pct` — see [Database setup](#database-setup)

---

## Install

```bash
cd server
npm install
```

This installs the four production dependencies
(`express`, `mysql2`, `dotenv`, `cors`) and one dev dependency (`nodemon`).

---

## Configure

Copy `server/.env.example` to `server/.env` and fill in the placeholders.

```bash
cp .env.example .env       # macOS / Linux
copy .env.example .env     # Windows
```

Required keys are documented inline in `.env.example`. The server will
**fail fast** at boot if a required env var is missing.

> The committed `.env.example` contains **placeholders only**. Real
> secrets live in `.env`, which is git-ignored.

---

## Database setup

The server expects a MySQL database matching `DB_NAME` (default `pct`).
The server **does not** silently create it — if it is missing,
`/api/health` will report `database.status: "disconnected"` with the
exact name to create.

To create it via XAMPP:

1. Start **MySQL** from the XAMPP control panel.
2. Open **phpMyAdmin** at <http://localhost/phpmyadmin>.
3. Click **New** in the left sidebar.
4. Database name: `pct`, collation: `utf8mb4_unicode_ci`.
5. Click **Create**.

(The schema itself is owned by a later phase. Phase 1 only verifies
connectivity.)

---

## Run

### Development (auto-reload)

```bash
npm run dev
```

### Production (single-process)

```bash
npm start
```

Both modes bind to `PORT` (default `5000`) and log:

```
[ISO_TIMESTAMP] [info] Starting PCT API in development mode
[ISO_TIMESTAMP] [info] Target database: root@localhost:3306/pct
[ISO_TIMESTAMP] [info] Database connection OK (...)
[ISO_TIMESTAMP] [info] PCT API listening on http://localhost:5000
```

---

## Endpoints (Phase 1)

| Method | Path           | Status          | Notes                                  |
|--------|----------------|-----------------|----------------------------------------|
| GET    | `/`            | 200             | Root pointer to `/api` and `/api/health` |
| GET    | `/api/health`  | 200 (ok / degraded) | Liveness + DB ping                  |
| GET    | `/metrics`     | 200             | Prometheus text exposition (`text/plain; version=0.0.4`) — public, unauthenticated |
| any    | `/api/auth/...`    | 501         | Stub — implemented in a later phase   |
| any    | `/api/users/...`   | 501         | Stub                                   |
| any    | `/api/projects/...`| 501         | Stub                                   |
| any    | `/api/tasks/...`   | 501         | Stub                                   |
| any    | `/api/reviews/...` | 501         | Stub                                   |
| any    | `/api/notifications/...` | 501   | Stub                                   |
| any    | `/api/activity/...` | 501        | Stub                                   |
| any    | `/api/reports/...` | 501         | Stub                                   |
| any    | `/api/settings/...`| 501         | Stub                                   |
| any    | `/api/files/...`   | 501         | Stub                                   |
| any    | (anything else) | 404             | `NOT_FOUND` via 404 handler            |

### Response shape

Success:

```json
{ "success": true, "message": "PCT API is running", "data": { ... } }
```

Error:

```json
{
  "success": false,
  "message": "Human-readable message",
  "error": { "code": "NOT_FOUND" }
}
```

Stack traces are only included in development. Secrets are never logged
or echoed — see `src/utils/logger.js` and `src/middleware/errorHandler.js`.

---

## Smoke test

```bash
curl http://localhost:5000/api/health
```

Expected (database present):

```json
{
  "success": true,
  "message": "PCT API is running",
  "data": {
    "status": "ok",
    "service": "pct-api",
    "version": "0.1.0",
    "uptime": 0.123,
    "database": {
      "status": "connected",
      "host": "localhost",
      "port": 3306,
      "name": "pct"
    },
    "timestamp": "2026-08-12T10:00:00.000Z"
  }
}
```

---

## What this phase does NOT include

- Authentication / sessions / JWT
- Users / Projects / Tasks / Reviews CRUD
- Notifications, Activity, Reports, Settings
- File uploads
- Tests, CI, Docker

All of the above are owned by later phases. The route mounts exist now
so the URL contract is locked in and the frontend can switch gradually.
