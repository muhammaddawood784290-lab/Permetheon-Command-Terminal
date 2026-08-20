#!/usr/bin/env bash
# =====================================================================
# scripts/test_metrics.sh
# Phase 4 — Prometheus `/metrics` test harness.
#
# Assumes:
#   - The PCT server is running on $BASE (default http://localhost:5000)
#   - The MySQL database does NOT need to be reachable: /metrics is
#     process-level only and must succeed even when the DB is down.
#
# Each test prints a single PASS / FAIL line. The final summary prints
# a count. Exits 0 if all PASS, otherwise the number of FAILures.
#
# Verifies:
#   * GET /metrics responds 200.
#   * Content-Type is the Prometheus exposition format.
#   * Body is Prometheus text (no JSON envelope leak).
#   * Expected metric families are present.
#   * No sensitive data leaks (no DB password/host/user, no SESSION_SECRET,
#     no environment variables, no stack traces).
#   * Does NOT require authentication (Prometheus scrapes anonymously).
#   * Regression: /api/health, /api/users, and /metrics route co-exist.
# =====================================================================

set -u

BASE="${BASE:-http://localhost:5000}"
TMP_DIR="${TMP_DIR:-$(mktemp -d)}"
PASS=0
FAIL=0

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

# do_curl HEADERS_FILE BODY_FILE -- curl args ...
# Captures status in $CODE, body in $BODY, headers in $HEADERS.
do_curl() {
  local hdr_file="$1"; shift
  local body_file="$1"; shift
  local code
  code=$(curl -sS -o "$body_file" -D "$hdr_file" -w '%{http_code}' "$@" 2>/dev/null)
  BODY=$(cat "$body_file")
  HEADERS=$(cat "$hdr_file")
  CODE="$code"
}

# ---------------------------------------------------------------------
# T01 — /metrics responds 200 without authentication.
# ---------------------------------------------------------------------
note "T01: GET /metrics -> 200 (no auth required)"
do_curl "$TMP_DIR/h1" "$TMP_DIR/b1" "$BASE/metrics"
assert "T01 status" "200" "$CODE"

# ---------------------------------------------------------------------
# T02 — Content-Type is the Prometheus exposition format.
# ---------------------------------------------------------------------
note "T02: Content-Type is Prometheus text exposition"
if echo "$HEADERS" | grep -i '^content-type:' | grep -i 'text/plain' >/dev/null; then
  printf "  [PASS] T02 content-type is text/plain\n"; PASS=$((PASS+1))
else
  printf "  [FAIL] T02 content-type is NOT text/plain\n  headers=%s\n" "$HEADERS"
  FAIL=$((FAIL+1))
fi
if echo "$HEADERS" | grep -i '^content-type:' | grep -i 'version=0.0.4' >/dev/null; then
  printf "  [PASS] T02 content-type carries version=0.0.4\n"; PASS=$((PASS+1))
else
  printf "  [FAIL] T02 content-type missing version=0.0.4\n  headers=%s\n" "$HEADERS"
  FAIL=$((FAIL+1))
fi

# ---------------------------------------------------------------------
# T03 — Cache-Control: no-store (process metrics must never be cached).
# ---------------------------------------------------------------------
note "T03: Cache-Control no-store"
if echo "$HEADERS" | grep -i '^cache-control:.*no-store' >/dev/null; then
  printf "  [PASS] T03 cache-control: no-store present\n"; PASS=$((PASS+1))
else
  printf "  [FAIL] T03 cache-control: no-store missing\n  headers=%s\n" "$HEADERS"
  FAIL=$((FAIL+1))
fi

# ---------------------------------------------------------------------
# T04 — Body is Prometheus text (begins with `# HELP`, not `{`).
# ---------------------------------------------------------------------
note "T04: Body is Prometheus exposition text"
if [[ "$BODY" == \#* ]]; then
  printf "  [PASS] T04 body starts with '#'\n"; PASS=$((PASS+1))
else
  printf "  [FAIL] T04 body does NOT start with '#' (got: %.40s...)\n" "$BODY"
  FAIL=$((FAIL+1))
fi
not_contains "T04 no JSON envelope" '"success":' "$BODY"
not_contains "T04 no JSON envelope" '"data":' "$BODY"

# ---------------------------------------------------------------------
# T05 — Required metric families present.
# ---------------------------------------------------------------------
note "T05: Required metric families are exposed"
contains "T05 service_info" "pct_service_info" "$BODY"
contains "T05 uptime"        "pct_process_uptime_seconds" "$BODY"
contains "T05 start_time"    "pct_process_start_time_seconds" "$BODY"
contains "T05 rss"           "pct_memory_rss_bytes" "$BODY"
contains "T05 heap_total"    "pct_memory_heap_total_bytes" "$BODY"
contains "T05 heap_used"     "pct_memory_heap_used_bytes" "$BODY"
contains "T05 cpu_user"      "pct_cpu_user_seconds_total" "$BODY"
contains "T05 cpu_system"    "pct_cpu_system_seconds_total" "$BODY"
contains "T05 eventloop"     "pct_nodejs_eventloop_lag_ms" "$BODY"
contains "T05 pid"           "pct_process_pid" "$BODY"

# ---------------------------------------------------------------------
# T06 — Histogram has bucket lines and the +Inf bucket.
# ---------------------------------------------------------------------
note "T06: Event-loop histogram has buckets and +Inf"
contains "T06 bucket le=1"   'pct_nodejs_eventloop_lag_ms_bucket{le="1"}' "$BODY"
contains "T06 bucket le=5000" 'pct_nodejs_eventloop_lag_ms_bucket{le="5000"}' "$BODY"
contains "T06 bucket +Inf"   'pct_nodejs_eventloop_lag_ms_bucket{le="+Inf"}' "$BODY"
contains "T06 sum"           'pct_nodejs_eventloop_lag_ms_sum' "$BODY"
contains "T06 count"         'pct_nodejs_eventloop_lag_ms_count' "$BODY"

# ---------------------------------------------------------------------
# T07 — Service info labels include name + version + environment.
# ---------------------------------------------------------------------
note "T07: pct_service_info labels"
contains "T07 label name"         'name="pct-api"' "$BODY"
contains "T07 label version"      'version=' "$BODY"
contains "T07 label node_version" 'node_version=' "$BODY"
contains "T07 label environment"  'environment=' "$BODY"

# ---------------------------------------------------------------------
# T08 — No sensitive data leaks.
# ---------------------------------------------------------------------
note "T08: No sensitive information is exposed"
not_contains "T08 no DB_PASSWORD" "DB_PASSWORD" "$BODY"
not_contains "T08 no SESSION_SECRET" "SESSION_SECRET" "$BODY"
not_contains "T08 no AUTH_SECRET" "AUTH_SECRET" "$BODY"
not_contains "T08 no password_hash" "password_hash" "$BODY"
not_contains "T08 no env var pattern" "process.env" "$BODY"
not_contains "T08 no stack trace" "at Object." "$BODY"
not_contains "T08 no JSON error envelope" '"error":' "$BODY"
not_contains "T08 no NODE_ENV value leak" "production_secret" "$BODY"

# ---------------------------------------------------------------------
# T09 — Endpoint is reachable WITHOUT a session cookie.
# ---------------------------------------------------------------------
note "T09: Endpoint reachable without cookies"
JAR_EMPTY="$TMP_DIR/empty.jar"
do_curl "$TMP_DIR/h9" "$TMP_DIR/b9" -b "$JAR_EMPTY" -c "$JAR_EMPTY" "$BASE/metrics"
assert "T09 status without jar" "200" "$CODE"
contains "T09 body without jar" "pct_service_info" "$BODY"

# ---------------------------------------------------------------------
# T10 — Regression: existing endpoints unaffected.
# ---------------------------------------------------------------------
note "T10: /api/health unaffected"
do_curl "$TMP_DIR/h10a" "$TMP_DIR/b10a" "$BASE/api/health"
assert "T10a /api/health status" "200" "$CODE"
contains "T10a /api/health body" '"service":"pct-api"' "$BODY"

note "T10: /api/users still requires authentication (401, NOT 200)"
do_curl "$TMP_DIR/h10b" "$TMP_DIR/b10b" "$BASE/api/users"
assert "T10b /api/users anon status" "401" "$CODE"
contains "T10b /api/users anon code" '"code":"UNAUTHORIZED"' "$BODY"

# ---------------------------------------------------------------------
# T11 — /metrics is mounted at root, NOT under /api.
# ---------------------------------------------------------------------
note "T11: /api/metrics does NOT exist (mounted at /)"
do_curl "$TMP_DIR/h11" "$TMP_DIR/b11" "$BASE/api/metrics"
assert "T11 /api/metrics status" "404" "$CODE"

# ---------------------------------------------------------------------
echo
echo "========================================================"
echo "PASS: $PASS    FAIL: $FAIL"
echo "========================================================"
rm -rf "$TMP_DIR"
exit $FAIL
