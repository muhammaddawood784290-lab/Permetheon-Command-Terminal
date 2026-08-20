// =====================================================================
// src/utils/logger.js
// Tiny development logger. Avoids logging secrets.
// Replace with a real logger in a later phase if needed.
// =====================================================================

function ts() {
  return new Date().toISOString();
}

function info(...args) {
  // eslint-disable-next-line no-console
  console.log(`[${ts()}] [info]`, ...args);
}

function warn(...args) {
  // eslint-disable-next-line no-console
  console.warn(`[${ts()}] [warn]`, ...args);
}

function error(...args) {
  // eslint-disable-next-line no-console
  console.error(`[${ts()}] [error]`, ...args);
}

module.exports = { info, warn, error };
