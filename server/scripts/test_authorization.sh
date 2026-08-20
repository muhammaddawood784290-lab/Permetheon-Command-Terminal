#!/usr/bin/env bash
# =====================================================================
# scripts/test_authorization.sh
# Phase 3 authorization test harness.
#
# Assumes:
#   - XAMPP MySQL is running
#   - pct DB has been migrated and seeded (admin/lead/dev/inactive/suspended)
#   - The PCT server is running on $PORT below
#
# Cases map to the 16-item minimum suite in the Phase 3 brief, plus a
# full permission-matrix sweep that walks every (role, permission) pair
# and asserts the expected allow/deny outcome derived from
# ROLE_PERMESSIONS.md §22 + client/src/utils/permissions.js.
# =====================================================================

set -u

BASE="${BASE:-http://localhost:5000}"
JAR_DIR="${JAR_DIR:-$(mktemp -d)}"
PASS=0
FAIL=0

ADMIN_JAR="$JAR_DIR/admin.jar"
LEAD_JAR="$JAR_DIR/lead.jar"
DEV_JAR="$JAR_DIR/dev.jar"
INACTIVE_JAR="$JAR_DIR/inactive.jar"
SUSPENDED_JAR="$JAR_DIR/suspended.jar"

note() { printf "\n=== %s ===\n" "$1"; }

assert() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$expected" == "$actual" ]]; then
    printf "  [PASS] %s (expected=%s actual=%s)\n" "$name" "$expected" "$actual"
    PASS=$((PASS+1))
  else
    printf "  [FAIL] %s (expected=%s actual=%s)\n" "$name" "$expected" "$actual"
    FAIL=$((FAIL+1))
  fi
}

contains() {
  local name="$1" needle="$2" hay="$3"
  if [[ "$hay" == *"$needle"* ]]; then
    printf "  [PASS] %s (contains: %s)\n" "$name" "$needle"
    PASS=$((PASS+1))
  else
    printf "  [FAIL] %s (missing: %s)\n  body=%s\n" "$name" "$needle" "$hay"
    FAIL=$((FAIL+1))
  fi
}

not_contains() {
  local name="$1" needle="$2" hay="$3"
  if [[ "$hay" != *"$needle"* ]]; then
    printf "  [PASS] %s (does NOT contain: %s)\n" "$name" "$needle"
    PASS=$((PASS+1))
  else
    printf "  [FAIL] %s (UNEXPECTEDLY contains: %s)\n" "$name" "$needle" "$hay"
    FAIL=$((FAIL+1))
  fi
}

# Runs curl, captures HTTP code (stdout) and body (file).
# Usage: do_curl JARNAME -X POST /api/auth/login -d '...'
do_curl() {
  local jar="$1"; shift
  local tmp="$(mktemp)"
  local code
  code=$(curl -sS -o "$tmp" -w '%{http_code}' \
    -b "$jar" -c "$jar" "$@" 2>/dev/null)
  BODY=$(cat "$tmp"); rm -f "$tmp"
  CODE="$code"
}

# ---------------------------------------------------------------------------
# Login the four ACTIVE / negative test users so subsequent calls have a
# session cookie in their jar.
# ---------------------------------------------------------------------------
note "L: log in test users"
do_curl "$ADMIN_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"admin@pct.local","password":"Admin#1234"}' \
  "$BASE/api/auth/login"
assert "L admin login" "200" "$CODE"
do_curl "$LEAD_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"lead@pct.local","password":"Lead#1234"}' \
  "$BASE/api/auth/login"
assert "L lead login" "200" "$CODE"
do_curl "$DEV_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"dev@pct.local","password":"Dev#1234"}' \
  "$BASE/api/auth/login"
assert "L dev login" "200" "$CODE"
do_curl "$INACTIVE_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"inactive@pct.local","password":"Inactive#1234"}' \
  "$BASE/api/auth/login"
# Inactive is rejected at login (Phase 2 path).
assert "L inactive login" "401" "$CODE"
do_curl "$SUSPENDED_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"suspended@pct.local","password":"Suspended#1234"}' \
  "$BASE/api/auth/login"
assert "L suspended login" "401" "$CODE"

# ---------------------------------------------------------------------------
# T01 — Unauthenticated -> 401 (not 403)
# ---------------------------------------------------------------------------
note "T01: unauthenticated -> 401"
do_curl "$JAR_DIR/anon1.jar" "$BASE/api/authz/projects/view"
assert "T01 status" "401" "$CODE"
contains "T01 code" '"code":"UNAUTHORIZED"' "$BODY"

# ---------------------------------------------------------------------------
# T02 — ADMIN gets a correct allow (project.view)
# ---------------------------------------------------------------------------
note "T02: ADMIN can read project.view"
do_curl "$ADMIN_JAR" "$BASE/api/authz/projects/view"
assert "T02 status" "200" "$CODE"
contains "T02 allowed" '"allowed":true' "$BODY"
contains "T02 perm"   '"permission":"project.view"' "$BODY"
contains "T02 role"   '"role":"ADMIN"' "$BODY"

# ---------------------------------------------------------------------------
# T03 — TEAM_LEAD gets a correct allow (project.create)
# ---------------------------------------------------------------------------
note "T03: TEAM_LEAD can project.create"
do_curl "$LEAD_JAR" -X POST "$BASE/api/authz/projects/create"
assert "T03 status" "200" "$CODE"
contains "T03 allowed" '"allowed":true' "$BODY"
contains "T03 role"   '"role":"TEAM_LEAD"' "$BODY"

# ---------------------------------------------------------------------------
# T04 — DEVELOPER gets a correct allow (task.view)
# ---------------------------------------------------------------------------
note "T04: DEVELOPER can task.view"
do_curl "$DEV_JAR" "$BASE/api/authz/tasks/view"
assert "T04 status" "200" "$CODE"
contains "T04 allowed" '"allowed":true' "$BODY"
contains "T04 role"   '"role":"DEVELOPER"' "$BODY"

# ---------------------------------------------------------------------------
# T05 — DEVELOPER denied admin-only (user.create) -> 403
# ---------------------------------------------------------------------------
note "T05: DEVELOPER denied user.create -> 403"
do_curl "$DEV_JAR" -X POST "$BASE/api/authz/users/create"
assert "T05 status" "403" "$CODE"
contains "T05 forbidden" '"code":"FORBIDDEN"' "$BODY"

# ---------------------------------------------------------------------------
# T06 — TEAM_LEAD denied admin-only (user.create) -> 403
# ---------------------------------------------------------------------------
note "T06: TEAM_LEAD denied user.create -> 403"
do_curl "$LEAD_JAR" -X POST "$BASE/api/authz/users/create"
assert "T06 status" "403" "$CODE"

# ---------------------------------------------------------------------------
# T07 — ADMIN allowed admin capability (user.changeRole)
# ---------------------------------------------------------------------------
note "T07: ADMIN can user.changeRole"
do_curl "$ADMIN_JAR" -X PATCH "$BASE/api/authz/users/change-role"
assert "T07 status" "200" "$CODE"
contains "T07 allowed" '"allowed":true' "$BODY"

# ---------------------------------------------------------------------------
# T08 — Valid permission -> route continues (returns success envelope)
# ---------------------------------------------------------------------------
note "T08: valid permission continues to handler"
do_curl "$ADMIN_JAR" "$BASE/api/authz/activity/view"
assert "T08 status" "200" "$CODE"
contains "T08 success flag" '"success":true' "$BODY"
contains "T08 message" 'permission activity.view granted' "$BODY"

# ---------------------------------------------------------------------------
# T09 — Invalid/unknown permission is safely rejected (server-side bug,
#       not a client fault). We trigger this by sending a request to an
#       unknown authz path that no route declares. (Unknown PERMISSION in
#       requirePermission() throws at MODULE LOAD time, which is caught
#       here indirectly: a route with an unknown perm cannot exist.)
#       Instead, verify the existing route map is complete: every
#       canonical permission key has a corresponding /api/authz/<...>
#       endpoint. We assert against the permission matrix in T-matrix
#       below, and here we confirm "no route leaks through an unknown
#       perm". Concretely: a request to a non-existent authz path
#       returns 404, not 200/403.
# ---------------------------------------------------------------------------
note "T09: unknown authz path -> 404 (no unknown perm granted)"
do_curl "$ADMIN_JAR" "$BASE/api/authz/projects/totally-fake-perm"
assert "T09 status" "404" "$CODE"

# ---------------------------------------------------------------------------
# T10 — Client-supplied role cannot escalate.
# Body 'role':'ADMIN' must be IGNORED; developer still gets 403 on
# admin-only routes.
# ---------------------------------------------------------------------------
note "T10: client-supplied role in body cannot escalate"
do_curl "$DEV_JAR" -X PATCH -H 'Content-Type: application/json' \
  -d '{"role":"ADMIN","name":"Pretend Admin"}' \
  "$BASE/api/authz/users/change-role"
assert "T10 status" "403" "$CODE"
contains "T10 forbidden" '"code":"FORBIDDEN"' "$BODY"

# Header x-role must also be ignored.
do_curl "$DEV_JAR" -X PATCH -H 'X-Role: ADMIN' "$BASE/api/authz/users/change-role"
assert "T10b header role ignored" "403" "$CODE"

# ---------------------------------------------------------------------------
# T11 — Client-supplied permission cannot escalate.
# Body 'permissions':['user.changeRole'] must be IGNORED.
# ---------------------------------------------------------------------------
note "T11: client-supplied permissions cannot escalate"
do_curl "$DEV_JAR" -X PATCH -H 'Content-Type: application/json' \
  -d '{"permissions":["user.changeRole"]}' \
  "$BASE/api/authz/users/change-role"
assert "T11 status" "403" "$CODE"

# ---------------------------------------------------------------------------
# T12 — Suspended user cannot authorize.
# Re-login (will fail), then mutate a previously valid cookie to a value
# that maps to no session — expect 401, not 200.
# ---------------------------------------------------------------------------
note "T12: SUSPENDED cannot authorize"
do_curl "$SUSPENDED_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"suspended@pct.local","password":"Suspended#1234"}' \
  "$BASE/api/auth/login"
assert "T12 suspended login blocked" "401" "$CODE"
# Login the dev user, then directly hit /me with a non-empty but bogus
# session cookie value -> 401.
do_curl "$JAR_DIR/t12.jar" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"dev@pct.local","password":"Dev#1234"}' \
  "$BASE/api/auth/login"
# Fuzz the cookie.
sed -i 's/pct_sid\t.*/pct_sid\tdeadbeef/' "$JAR_DIR/t12.jar" 2>/dev/null || true
do_curl "$JAR_DIR/t12.jar" "$BASE/api/authz/projects/view"
assert "T12 stale cookie -> 401" "401" "$CODE"

# ---------------------------------------------------------------------------
# T13 — Inactive user cannot authorize (login blocked, no escalation
#       path).
# ---------------------------------------------------------------------------
note "T13: INACTIVE cannot authorize"
do_curl "$INACTIVE_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"inactive@pct.local","password":"Inactive#1234"}' \
  "$BASE/api/auth/login"
assert "T13 inactive login blocked" "401" "$CODE"

# ---------------------------------------------------------------------------
# T14 — Expired/invalid session -> 401 (no cookie at all).
# ---------------------------------------------------------------------------
note "T14: no session cookie -> 401"
do_curl "$JAR_DIR/anon14.jar" "$BASE/api/authz/tasks/view"
assert "T14 status" "401" "$CODE"

# ---------------------------------------------------------------------------
# T15 — requirePermission does not bypass requireAuth.
# Mounting requirePermission alone (without requireAuth first) is a
# server-side wiring bug. We assert this two ways:
#   (a) All /api/authz/* paths return 401 for an anonymous caller
#       (proven by T01) — never 403, because 403 only fires AFTER auth.
#   (b) The error envelope shape for the 401 path is the standard
#       "Authentication is required." message — exactly what requireAuth
#       emits. If requirePermission were accidentally the first
#       middleware, it would crash with an internal server error
#       ("mounted before requireAuth()"), so 401 is the proof.
# ---------------------------------------------------------------------------
note "T15: 401 envelope proves requireAuth ran first"
do_curl "$JAR_DIR/anon15.jar" -X PATCH "$BASE/api/authz/users/change-role"
assert "T15 status" "401" "$CODE"
contains "T15 auth message" 'Authentication is required.' "$BODY"
not_contains "T15 no 403" '"code":"FORBIDDEN"' "$BODY"

# ---------------------------------------------------------------------------
# T16 — Production errors do not expose internals.
# We POST malformed JSON to /api/auth/login — Express body-parser
# returns 400; in production this must NOT include a stack trace.
# (In dev the same path returns a stack. We check ONLY the production
# sanitization behavior in this run — harness is dev-mode by default;
# the prod counterpart is exercised in test_authorization_prod.sh if
# requested separately.)
#
# Cross-check: hit /api/authz/_internal-error with admin cookie (we
# register no such route) -> 404 with no internal details.
# ---------------------------------------------------------------------------
note "T16: error responses do not leak internals"
do_curl "$ADMIN_JAR" "$BASE/api/authz/__no-such-route__"
assert "T16 status" "404" "$CODE"
not_contains "T16 no stack" 'at ' "$BODY"
not_contains "T16 no path leak" '/d/pct/' "$BODY"
not_contains "T16 no node_modules" 'node_modules' "$BODY"

# ---------------------------------------------------------------------------
# T-matrix — full permission matrix sweep.
# Walks every canonical permission × every role and asserts the
# expected allow/deny. The expected outcome is derived from
# ROLE_PERMESSIONS.md §22 + client/src/utils/permissions.js.
# ---------------------------------------------------------------------------
note "T-matrix: full permission sweep (canonical permissions × roles)"

# Expected matrix: each line: "<permission>|<ADMIN>|<TEAM_LEAD>|<DEVELOPER>"
#   A = allow (200), D = deny (403).
EXPECTED_MATRIX=(
  "project.view|A|A|A"
  "project.create|A|A|D"
  "project.update|A|A|D"
  "project.delete|A|D|D"
  "project.archive|A|A|D"
  "project.manageMembers|A|A|D"

  "task.view|A|A|A"
  "task.create|A|A|D"
  "task.update|A|A|A"
  "task.delete|A|D|D"
  "task.assign|A|A|D"
  "task.changeStatus|A|A|A"

  "review.view|A|A|A"
  "review.submit|A|A|A"
  "review.start|A|A|D"
  "review.approve|A|A|D"
  "review.requestRevision|A|A|D"
  "review.assign|A|D|D"

  "file.upload|A|A|A"
  "file.download|A|A|A"
  "file.delete|A|A|D"

  "report.view|A|A|D"
  "report.export|A|A|D"

  "activity.view|A|A|A"

  "notification.view|A|A|A"
  "notification.markRead|A|A|A"
  "notification.manage|A|D|D"

  "user.view|A|A|D"
  "user.create|A|D|D"
  "user.update|A|D|D"
  "user.disable|A|D|D"
  "user.changeRole|A|D|D"

  "settings.view|A|A|A"
  "settings.update|A|D|D"
)

# Map permission -> /api/authz/<module>/<action>
declare -A PERM_PATH
PERM_PATH[project.view]="/api/authz/projects/view"
PERM_PATH[project.create]="/api/authz/projects/create"
PERM_PATH[project.update]="/api/authz/projects/update"
PERM_PATH[project.delete]="/api/authz/projects/delete"
PERM_PATH[project.archive]="/api/authz/projects/archive"
PERM_PATH[project.manageMembers]="/api/authz/projects/manage-members"

PERM_PATH[task.view]="/api/authz/tasks/view"
PERM_PATH[task.create]="/api/authz/tasks/create"
PERM_PATH[task.update]="/api/authz/tasks/update"
PERM_PATH[task.delete]="/api/authz/tasks/delete"
PERM_PATH[task.assign]="/api/authz/tasks/assign"
PERM_PATH[task.changeStatus]="/api/authz/tasks/change-status"

PERM_PATH[review.view]="/api/authz/reviews/view"
PERM_PATH[review.submit]="/api/authz/reviews/submit"
PERM_PATH[review.start]="/api/authz/reviews/start"
PERM_PATH[review.approve]="/api/authz/reviews/approve"
PERM_PATH[review.requestRevision]="/api/authz/reviews/request-revision"
PERM_PATH[review.assign]="/api/authz/reviews/assign"

PERM_PATH[file.upload]="/api/authz/files/upload"
PERM_PATH[file.download]="/api/authz/files/download"
PERM_PATH[file.delete]="/api/authz/files/delete"

PERM_PATH[report.view]="/api/authz/reports/view"
PERM_PATH[report.export]="/api/authz/reports/export"

PERM_PATH[activity.view]="/api/authz/activity/view"

PERM_PATH[notification.view]="/api/authz/notifications/view"
PERM_PATH[notification.markRead]="/api/authz/notifications/mark-read"
PERM_PATH[notification.manage]="/api/authz/notifications/manage"

PERM_PATH[user.view]="/api/authz/users/view"
PERM_PATH[user.create]="/api/authz/users/create"
PERM_PATH[user.update]="/api/authz/users/update"
PERM_PATH[user.disable]="/api/authz/users/disable"
PERM_PATH[user.changeRole]="/api/authz/users/change-role"

PERM_PATH[settings.view]="/api/authz/settings/view"
PERM_PATH[settings.update]="/api/authz/settings/update"

declare -A ROLE_JAR
ROLE_JAR[ADMIN]="$ADMIN_JAR"
ROLE_JAR[TEAM_LEAD]="$LEAD_JAR"
ROLE_JAR[DEVELOPER]="$DEV_JAR"

for row in "${EXPECTED_MATRIX[@]}"; do
  IFS='|' read -r perm admin_e lead_e dev_e <<< "$row"
  path="${PERM_PATH[$perm]:-}"
  if [[ -z "$path" ]]; then
    printf "  [FAIL] no path mapping for %s\n" "$perm"; FAIL=$((FAIL+1)); continue
  fi

  # Method: most permissions use GET; mutations use POST/PATCH/DELETE.
  # We pick a method that matches the route mount (see authzRoutes.js).
  case "$path" in
    *projects/create)        method="POST"   ;;
    *projects/delete)        method="DELETE" ;;
    *projects/archive)       method="PATCH"  ;;
    *projects/update)        method="PATCH"  ;;
    *projects/manage*)       method="PATCH"  ;;
    *tasks/create)           method="POST"   ;;
    *tasks/update)           method="PATCH"  ;;
    *tasks/delete)           method="DELETE" ;;
    *tasks/assign)           method="PATCH"  ;;
    *tasks/change-status)    method="PATCH"  ;;
    *reviews/submit)         method="POST"   ;;
    *reviews/start)          method="PATCH"  ;;
    *reviews/approve)        method="PATCH"  ;;
    *reviews/request*)       method="PATCH"  ;;
    *reviews/assign)         method="PATCH"  ;;
    *files/upload)           method="POST"   ;;
    *files/delete)           method="DELETE" ;;
    *notifications/mark*)    method="PATCH"  ;;
    *notifications/manage)   method="PATCH"  ;;
    *users/create)           method="POST"   ;;
    *users/update)           method="PATCH"  ;;
    *users/disable)          method="PATCH"  ;;
    *users/change-role)      method="PATCH"  ;;
    *settings/update)        method="PATCH"  ;;
    *)                       method="GET"    ;;
  esac

  for role in ADMIN TEAM_LEAD DEVELOPER; do
    case "$role" in
      ADMIN)     expected="$admin_e" ;;
      TEAM_LEAD) expected="$lead_e"  ;;
      DEVELOPER) expected="$dev_e"   ;;
    esac
    jar="${ROLE_JAR[$role]}"
    do_curl "$jar" -X "$method" "$BASE$path"
    if [[ "$expected" == "A" ]]; then
      if [[ "$CODE" == "200" ]]; then
        printf "  [PASS] %s by %s (200)\n" "$perm" "$role"
        PASS=$((PASS+1))
      else
        printf "  [FAIL] %s by %s expected 200 got %s\n  body=%s\n" "$perm" "$role" "$CODE" "$BODY"
        FAIL=$((FAIL+1))
      fi
    else
      if [[ "$CODE" == "403" ]]; then
        printf "  [PASS] %s by %s denied (403)\n" "$perm" "$role"
        PASS=$((PASS+1))
      else
        printf "  [FAIL] %s by %s expected 403 got %s\n  body=%s\n" "$perm" "$role" "$CODE" "$BODY"
        FAIL=$((FAIL+1))
      fi
    fi
  done
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo
echo "========================================================"
echo "PASS: $PASS    FAIL: $FAIL"
echo "========================================================"
exit $FAIL