// =====================================================================
// src/server.js
// Bootstrap. Validates environment, verifies DB connectivity, then
// starts the HTTP listener. Fails fast on missing config; degrades
// gracefully on DB issues (health endpoint reports the actual state).
// =====================================================================

const env = require('./config/env');
const { verifyConnection, closePool } = require('./config/database');
const logger = require('./utils/logger');
const createApp = require('./app');

async function start() {
  logger.info(`Starting PCT API in ${env.NODE_ENV} mode`);
  logger.info(`Target database: ${env.DB_USER}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);

  // Probe DB but do not crash the server — health endpoint will report
  // the state. If the operator hasn't created the database yet, the
  // server should still come up so the issue can be diagnosed via HTTP.
  const db = await verifyConnection();
  if (db.ok) {
    logger.info(`Database connection OK (${db.host}:${db.port}/${db.database})`);
  } else {
    logger.warn(
      `Database connection FAILED at startup: ${db.code} - ${db.message}. ` +
        `Server will still start; /api/health will report 'degraded'. ` +
        `Create the database '${db.database}' in XAMPP/phpMyAdmin if missing.`,
    );
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`PCT API listening on http://localhost:${env.PORT}`);
    logger.info(`CORS origin: ${env.FRONTEND_URL}`);
    logger.info(`Try: curl http://localhost:${env.PORT}/api/health`);
  });

  // Graceful shutdown.
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(async () => {
      try {
        await closePool();
      } catch (e) {
        logger.warn(`Error closing pool: ${e.message}`);
      }
      process.exit(0);
    });
    // Hard exit if shutdown takes too long.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
  });
}

start().catch((err) => {
  logger.error('Fatal startup error:', err.message || err);
  process.exit(1);
});
