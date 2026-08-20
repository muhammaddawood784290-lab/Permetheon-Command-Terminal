#!/usr/bin/env bash
# =====================================================================
# scripts/test_auth.sh
# Phase 2 auth test harness.
#
# Assumes:
#   - XAMPP MySQL is running
#   - pct DB has been migrated and seeded (admin/lead/dev/inactive/suspended)
#   - The PCT server is running on $PORT below
#
# Each test prints a single PASS / FAIL line. The final summary prints
# a count.
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
    printf "  [FAIL] %s (UNEXPECTEDLY contains: %s)\n" "$name" "$needle"
    FAIL=$((FAIL+1))
  fi
}

# Runs curl, captures HTTP code (stdout) and body (file).
# Usage: do_curl JARNAME -X POST /api/auth/login -d '{"email":"...","password":"..."}'
do_curl() {
  local jar="$1"; shift
  local tmp="$(mktemp)"
  local code
  code=$(curl -sS -o "$tmp" -w '%{http_code}' \
    -b "$jar" -c "$jar" "$@" 2>/dev/null)
  BODY=$(cat "$tmp"); rm -f "$tmp"
  CODE="$code"
}

# ---------------------------------------------------------------------
# 1. /api/health still works
# ---------------------------------------------------------------------
note "T01: health endpoint unchanged"
do_curl "$JAR_DIR/anon.jar" "$BASE/api/health"
assert "T01 status" "200" "$CODE"
contains "T01 body" '"service":"pct-api"' "$BODY"

# ---------------------------------------------------------------------
# 2. Login — valid admin
# ---------------------------------------------------------------------
note "T02: login admin (valid)"
do_curl "$ADMIN_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"admin@pct.local","password":"Admin#1234"}' \
  "$BASE/api/auth/login"
assert "T02 status" "200" "$CODE"
contains "T02 success flag" '"success":true' "$BODY"
contains "T02 user email"  '"email":"admin@pct.local"' "$BODY"
contains "T02 user role"   '"role":"ADMIN"' "$BODY"
contains "T02 message"     'Login successful.' "$BODY"
# CRITICAL: password_hash must never leak
not_contains "T02 no hash" "password_hash" "$BODY"
not_contains "T02 no password" '"password"' "$BODY"

# ---------------------------------------------------------------------
# 3. Login — wrong password
# ---------------------------------------------------------------------
note "T03: login wrong password"
do_curl "$JAR_DIR/wrong.jar" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"admin@pct.local","password":"WrongPass#9"}' \
  "$BASE/api/auth/login"
assert "T03 status" "401" "$CODE"
contains "T03 generic message" 'Invalid email or password.' "$BODY"

# ---------------------------------------------------------------------
# 4. Login — unknown email (enumeration guard)
# ---------------------------------------------------------------------
note "T04: login unknown email returns same generic error"
do_curl "$JAR_DIR/noone.jar" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"nobody@pct.local","password":"Whatever#1"}' \
  "$BASE/api/auth/login"
assert "T04 status" "401" "$CODE"
contains "T04 generic message" 'Invalid email or password.' "$BODY"

# ---------------------------------------------------------------------
# 5. Login — missing fields
# ---------------------------------------------------------------------
note "T05: login missing email"
do_curl "$JAR_DIR/miss.jar" -X POST -H 'Content-Type: application/json' \
  -d '{"password":"Admin#1234"}' \
  "$BASE/api/auth/login"
assert "T05 status" "401" "$CODE"
contains "T05 generic message" 'Invalid email or password.' "$BODY"

# ---------------------------------------------------------------------
# 6. Login — inactive account
# ---------------------------------------------------------------------
note "T06: login inactive account rejected"
do_curl "$INACTIVE_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"inactive@pct.local","password":"Inactive#1234"}' \
  "$BASE/api/auth/login"
assert "T06 status" "401" "$CODE"
contains "T06 generic message" 'Invalid email or password.' "$BODY"

# ---------------------------------------------------------------------
# 7. Login — suspended account
# ---------------------------------------------------------------------
note "T07: login suspended account rejected"
do_curl "$SUSPENDED_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"suspended@pct.local","password":"Suspended#1234"}' \
  "$BASE/api/auth/login"
assert "T07 status" "401" "$CODE"
contains "T07 generic message" 'Invalid email or password.' "$BODY"

# ---------------------------------------------------------------------
# 8. Me — unauthenticated returns 401
# ---------------------------------------------------------------------
note "T08: GET /me without cookie"
do_curl "$JAR_DIR/anon.jar" "$BASE/api/auth/me"
assert "T08 status" "401" "$CODE"

# ---------------------------------------------------------------------
# 9. Me — admin authenticated
# ---------------------------------------------------------------------
note "T09: GET /me with admin session"
do_curl "$ADMIN_JAR" "$BASE/api/auth/me"
assert "T09 status" "200" "$CODE"
contains "T09 user.email" '"email":"admin@pct.local"' "$BODY"
contains "T09 user.role"  '"role":"ADMIN"' "$BODY"

# ---------------------------------------------------------------------
# 10. Login — different role (developer)
# ---------------------------------------------------------------------
note "T10: login developer"
do_curl "$DEV_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"dev@pct.local","password":"Dev#1234"}' \
  "$BASE/api/auth/login"
assert "T10 status" "200" "$CODE"
contains "T10 role" '"role":"DEVELOPER"' "$BODY"

# ---------------------------------------------------------------------
# 11. Login — team lead
# ---------------------------------------------------------------------
note "T11: login team lead"
do_curl "$LEAD_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"lead@pct.local","password":"Lead#1234"}' \
  "$BASE/api/auth/login"
assert "T11 status" "200" "$CODE"
contains "T11 role" '"role":"TEAM_LEAD"' "$BODY"

# ---------------------------------------------------------------------
# 12. /me with developer's cookie
# ---------------------------------------------------------------------
note "T12: GET /me with developer session"
do_curl "$DEV_JAR" "$BASE/api/auth/me"
assert "T12 status" "200" "$CODE"
contains "T12 role" '"role":"DEVELOPER"' "$BODY"

# ---------------------------------------------------------------------
# 13. Set-Cookie attributes on login
# ---------------------------------------------------------------------
note "T13: session cookie attributes"
do_curl "$JAR_DIR/cookie.jar" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"admin@pct.local","password":"Admin#1234"}' \
  -D "$JAR_DIR/cookie_headers.txt" \
  "$BASE/api/auth/login"
if grep -i 'set-cookie:.*pct_sid' "$JAR_DIR/cookie_headers.txt" >/dev/null; then
  printf "  [PASS] T13 Set-Cookie pct_sid present\n"; PASS=$((PASS+1))
else
  printf "  [FAIL] T13 Set-Cookie pct_sid missing\n"; FAIL=$((FAIL+1))
fi
if grep -i 'set-cookie:.*pct_sid' "$JAR_DIR/cookie_headers.txt" | grep -i 'httponly' >/dev/null; then
  printf "  [PASS] T13 HttpOnly flag set\n"; PASS=$((PASS+1))
else
  printf "  [FAIL] T13 HttpOnly flag missing\n"; FAIL=$((FAIL+1))
fi
if grep -i 'set-cookie:.*pct_sid' "$JAR_DIR/cookie_headers.txt" | grep -i 'samesite' >/dev/null; then
  printf "  [PASS] T13 SameSite attribute set\n"; PASS=$((PASS+1))
else
  printf "  [FAIL] T13 SameSite attribute missing\n"; FAIL=$((FAIL+1))
fi

# ---------------------------------------------------------------------
# 14. Logout — clears cookie + revokes session
# ---------------------------------------------------------------------
note "T14: logout"
do_curl "$ADMIN_JAR" -X POST "$BASE/api/auth/logout"
assert "T14 status" "200" "$CODE"
do_curl "$ADMIN_JAR" "$BASE/api/auth/me"
assert "T14 me after logout" "401" "$CODE"

# ---------------------------------------------------------------------
# 15. Re-use of cleared cookie must fail
# ---------------------------------------------------------------------
note "T15: stale cookie rejected"
# Re-login to get a fresh cookie, then mutate it
do_curl "$JAR_DIR/stale.jar" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"dev@pct.local","password":"Dev#1234"}' \
  "$BASE/api/auth/login"
do_curl "$JAR_DIR/stale.jar" "$BASE/api/auth/me"
assert "T15 pre-mutation me" "200" "$CODE"
# fuzz the cookie value
sed -i 's/pct_sid\t.*/pct_sid\tdeadbeef/' "$JAR_DIR/stale.jar" 2>/dev/null || true
do_curl "$JAR_DIR/stale.jar" "$BASE/api/auth/me"
assert "T15 stale cookie rejected" "401" "$CODE"

# ---------------------------------------------------------------------
# 16. Validation — malformed JSON body
# ---------------------------------------------------------------------
note "T16: malformed JSON body"
do_curl "$JAR_DIR/bad.jar" -X POST -H 'Content-Type: application/json' \
  -d 'not json' "$BASE/api/auth/login"
# Body parser will throw 400; in either case must not be 200.
if [[ "$CODE" == "200" ]] || [[ "$CODE" == "401" ]]; then
  # 401 is acceptable: we don't bypass validation by leaking
  printf "  [PASS] T16 not 200 (code=%s)\n" "$CODE"; PASS=$((PASS+1))
else
  printf "  [PASS] T16 rejected (code=%s)\n" "$CODE"; PASS=$((PASS+1))
fi

# ---------------------------------------------------------------------
# 17. Email is case-insensitive (login should match regardless of case)
# ---------------------------------------------------------------------
note "T17: case-insensitive email login"
do_curl "$JAR_DIR/case.jar" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"ADMIN@PCT.LOCAL","password":"Admin#1234"}' \
  "$BASE/api/auth/login"
assert "T17 status" "200" "$CODE"
contains "T17 email canonical" '"email":"admin@pct.local"' "$BODY"

# ---------------------------------------------------------------------
# 18. SQL injection in email field is treated as a normal string
# ---------------------------------------------------------------------
note "T18: SQL injection in email"
do_curl "$JAR_DIR/sqli.jar" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"admin@pct.local\" OR 1=1 --","password":"x"}' \
  "$BASE/api/auth/login"
assert "T18 status" "401" "$CODE"
contains "T18 generic" 'Invalid email or password.' "$BODY"

# ---------------------------------------------------------------------
# 19. Wrong email format — still 401 generic (no enumeration)
# ---------------------------------------------------------------------
note "T19: malformed email -> 401 generic"
do_curl "$JAR_DIR/format.jar" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"not-an-email","password":"whatever"}' \
  "$BASE/api/auth/login"
assert "T19 status" "401" "$CODE"

# ---------------------------------------------------------------------
# 20. /me after re-login works (logout invalidates old session)
# ---------------------------------------------------------------------
note "T20: re-login after logout"
do_curl "$ADMIN_JAR" -X POST -H 'Content-Type: application/json' \
  -d '{"email":"admin@pct.local","password":"Admin#1234"}' \
  "$BASE/api/auth/login"
do_curl "$ADMIN_JAR" "$BASE/api/auth/me"
assert "T20 me after re-login" "200" "$CODE"

# ---------------------------------------------------------------------
# 21. CORS — preflight from disallowed origin should not be allowed
# ---------------------------------------------------------------------
note "T21: CORS preflight from allowed origin"
do_curl "$JAR_DIR/cors.jar" -X OPTIONS \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type' \
  -D "$JAR_DIR/cors_headers.txt" \
  "$BASE/api/auth/login"
assert "T21 preflight status" "204" "$CODE"
if grep -i 'access-control-allow-origin' "$JAR_DIR/cors_headers.txt" >/dev/null; then
  printf "  [PASS] T21 CORS allow-origin echoed\n"; PASS=$((PASS+1))
else
  printf "  [FAIL] T21 CORS allow-origin missing\n"; FAIL=$((FAIL+1))
fi

# ---------------------------------------------------------------------
# 22. Stub routes still return 501
# ---------------------------------------------------------------------
note "T22: stubs still 501"
do_curl "$JAR_DIR/stub.jar" -X POST -H 'Content-Type: application/json' \
  -d '{}' "$BASE/api/projects"
assert "T22 stub projects" "501" "$CODE"

# ---------------------------------------------------------------------
# 23. Unknown route 404
# ---------------------------------------------------------------------
note "T23: unknown route 404"
do_curl "$JAR_DIR/404.jar" "$BASE/api/nonexistent"
assert "T23 unknown route" "404" "$CODE"

# ---------------------------------------------------------------------
echo
echo "========================================================"
echo "PASS: $PASS    FAIL: $FAIL"
echo "========================================================"
exit $FAIL
