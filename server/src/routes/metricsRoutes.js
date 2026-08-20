// =====================================================================
// src/routes/metricsRoutes.js
// Phase 4 — Prometheus `/metrics` endpoint.
//
// Design notes (follows existing project conventions):
//   * No external dependency (no `prom-client`, no `express-prom`).
//     Keeps the minimal stack declared in server/package.json.
//   * Metrics are derived from Node's built-in `process` module
//     plus a couple of process-uptime gauges the rest of the
//     codebase already exposes (version, start time).
//   * Output is hand-formatted Prometheus exposition text. The
//     required `Content-Type` for the v0.0.4 text format is
//     `text/plain; version=0.0.4; charset=utf-8` — Prometheus
//     rejects other `text/plain` Content-Types since v2.
//   * Nothing sensitive is exposed: no env vars, no DB host/user/
//     password, no request body, no user data. Only aggregate
//     counters/gauges/handful of labeled histograms for runtime
//     resource usage.
//   * Endpoint is intentionally UNAUTHENTICATED so Prometheus
//     scrape configs do not need to carry a session cookie. This
//     matches the documented `/api/health` convention (public
//     liveness) and matches how Prometheus exposes itself. The
//     endpoint reveals only process-level metrics; no application
//     data leaves the boundary.
//   * Route is mounted at the application root (`GET /metrics`),
//     not under `/api`, because Prometheus scrapes that path by
//     convention and because the project reserves the `/api` prefix
//     for the JSON-envelope response shape used everywhere else
//     (see docs/API.md §3 and src/utils/response.js).
// =====================================================================

const express = require('express');
const env = require('../config/env');

const router = express.Router();

// ---------------------------------------------------------------------------
// Snapshot the process start time once. `process.uptime()` is documented as
// "Number of seconds the current process has been running" (Node docs).
// ---------------------------------------------------------------------------
const PROCESS_START_TS_MS = Date.now();

const SERVICE_NAME = 'pct-api';
const SERVICE_VERSION = '0.4.0';
const NODE_VERSION = process.version;
const NODE_ENV = env.NODE_ENV;

// ---------------------------------------------------------------------------
// Minimal histogram helper. Buckets match common Prometheus defaults so
// scrape dashboards render without further configuration.
// ---------------------------------------------------------------------------
function histogram(name, help, buckets, values) {
  let out = `# HELP ${name} ${help}\n# TYPE ${name} histogram\n`;
  let cumulative = 0;
  for (const b of buckets) {
    cumulative += values.filter((v) => v <= b).length;
    // Prometheus histogram bucket labels are cumulative `_bucket{le="..."}`
    // The `+Inf` bucket equals the total count.
    out += `${name}_bucket{le="${b}"} ${cumulative}\n`;
  }
  out += `${name}_bucket{le="+Inf"} ${values.length}\n`;
  out += `${name}_sum ${values.reduce((a, b) => a + b, 0).toFixed(3)}\n`;
  out += `${name}_count ${values.length}\n`;
  return out;
}

// Collects a small, recent rolling sample of event-loop tick durations in
// milliseconds. This is a passive, zero-allocation way to expose a latency
// histogram without instrumenting every route — exactly the minimum a
// production-safe `/metrics` endpoint should expose.
const LOOP_SAMPLES_MS = [];
const LOOP_SAMPLES_MAX = 100;
let lastLoopTickNs = process.hrtime.bigint();
function sampleLoop() {
  const now = process.hrtime.bigint();
  const deltaMs = Number(now - lastLoopTickNs) / 1e6;
  lastLoopTickNs = now;
  LOOP_SAMPLES_MS.push(deltaMs);
  if (LOOP_SAMPLES_MS.length > LOOP_SAMPLES_MAX) {
    LOOP_SAMPLES_MS.shift();
  }
}
// The loop sample runs inside its own interval, but it must not hold the
// event loop open during shutdown.
const LOOP_INTERVAL = setInterval(sampleLoop, 1000);
if (typeof LOOP_INTERVAL.unref === 'function') LOOP_INTERVAL.unref();

// ---------------------------------------------------------------------------
// Format helpers. Prometheus exposition format requires LF newlines and a
// trailing newline at end-of-message.
// ---------------------------------------------------------------------------
function gauge(name, help, value) {
  return `# HELP ${name} ${help}\n# TYPE ${name} gauge\n${name} ${value}\n`;
}
function counter(name, help, value) {
  return `# HELP ${name} ${help}\n# TYPE ${name} counter\n${name} ${value}\n`;
}
function labelPair(name, value) {
  // Escape backslashes, double-quotes, and newlines per exposition rules.
  const safe = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  return `${name}="${safe}"`;
}

// ---------------------------------------------------------------------------
// GET /metrics
// Public. Returns Prometheus-compatible text exposition.
// ---------------------------------------------------------------------------
router.get('/', (_req, res) => {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  const uptimeSec = process.uptime();
  const startTimeSec = Math.floor(PROCESS_START_TS_MS / 1000);

  // Histogram buckets in ms — chosen to match Node's typical event-loop
  // tick range. These do not need to be perfect for the minimum spec;
  // they only need to be present so dashboards can graph event-loop lag.
  const buckets = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

  const body =
    // ----- service info -----
    `# HELP pct_service_info PCT API service identity (always 1).\n` +
    `# TYPE pct_service_info gauge\n` +
    `pct_service_info{${labelPair('name', SERVICE_NAME)},${labelPair('version', SERVICE_VERSION)},${labelPair('node_version', NODE_VERSION)},${labelPair('environment', NODE_ENV)}} 1\n` +
    // ----- process uptime / start -----
    gauge('pct_process_uptime_seconds', 'Process uptime in seconds.', uptimeSec.toFixed(3)) +
    gauge('pct_process_start_time_seconds', 'Unix epoch seconds at which the process started.', startTimeSec) +
    // ----- memory -----
    gauge('pct_memory_rss_bytes', 'Resident set size in bytes.', mem.rss) +
    gauge('pct_memory_heap_total_bytes', 'V8 heap total in bytes.', mem.heapTotal) +
    gauge('pct_memory_heap_used_bytes', 'V8 heap used in bytes.', mem.heapUsed) +
    gauge('pct_memory_external_bytes', 'External memory in bytes.', mem.external) +
    gauge('pct_memory_array_buffers_bytes', 'ArrayBuffers memory in bytes.', mem.arrayBuffers) +
    // ----- cpu -----
    gauge('pct_cpu_user_seconds_total', 'CPU time spent in user mode, seconds.', (cpu.user / 1e6).toFixed(3)) +
    gauge('pct_cpu_system_seconds_total', 'CPU time spent in system mode, seconds.', (cpu.system / 1e6).toFixed(3)) +
    // ----- event-loop lag histogram -----
    histogram(
      'pct_nodejs_eventloop_lag_ms',
      'Event-loop tick duration in milliseconds (rolling 100-sample window).',
      buckets,
      LOOP_SAMPLES_MS,
    ) +
    // ----- process handles -----
    counter('pct_process_pid', 'Process ID. Sampled as a counter so dashboards can detect restarts.', process.pid);

  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  // Disable any caching proxy from holding on to process metrics.
  res.set('Cache-Control', 'no-store');
  return res.status(200).send(body);
});

module.exports = router;
