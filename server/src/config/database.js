// =====================================================================
// src/config/database.js
// MySQL connection pool using mysql2/promise.
// One pool per process. Reusable across controllers/services.
// =====================================================================

const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Keep date handling predictable.
  dateStrings: false,
  // mysql2 returns BIGINT as string by default; convert to number when safe.
  supportBigNumbers: true,
  bigNumberStrings: false,
  decimalNumbers: true,
});

/**
 * Run a single query with parameters.
 * Throws if the database connection itself fails (caller decides
 * how to surface that to the user).
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Verify connectivity by acquiring a connection and pinging.
 * Resolves to { ok: true, ...info } or { ok: false, code, message }.
 * Never throws — the caller (startup) decides how to react.
 */
async function verifyConnection() {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.ping();
      return {
        ok: true,
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
      };
    } finally {
      conn.release();
    }
  } catch (err) {
    return {
      ok: false,
      code: err.code || 'UNKNOWN',
      message: err.message,
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
    };
  }
}

async function closePool() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  verifyConnection,
  closePool,
};
