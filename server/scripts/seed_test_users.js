// =====================================================================
// scripts/seed_test_users.js
// Phase 2: seed test users (one per role) and an inactive + suspended
// user for negative-path tests. Idempotent: re-runs replace rows.
//
//   admin@pct.local      / Admin#1234   (ADMIN,   ACTIVE)
//   lead@pct.local       / Lead#1234    (TEAM_LEAD, ACTIVE)
//   dev@pct.local        / Dev#1234     (DEVELOPER, ACTIVE)
//   inactive@pct.local   / Inactive#1234 (DEVELOPER, INACTIVE)
//   suspended@pct.local  / Suspended#1234 (DEVELOPER, SUSPENDED)
//
// Usage: node scripts/seed_test_users.js
// =====================================================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/utils/password');

const USERS = [
  { name: 'Test Admin',          email: 'admin@pct.local',     password: 'Admin#1234',    role: 'ADMIN',      status: 'ACTIVE'    },
  { name: 'Test Lead',           email: 'lead@pct.local',      password: 'Lead#1234',     role: 'TEAM_LEAD',  status: 'ACTIVE'    },
  { name: 'Test Developer',      email: 'dev@pct.local',       password: 'Dev#1234',      role: 'DEVELOPER',  status: 'ACTIVE'    },
  { name: 'Test Inactive',       email: 'inactive@pct.local',  password: 'Inactive#1234', role: 'DEVELOPER',  status: 'INACTIVE'  },
  { name: 'Test Suspended',      email: 'suspended@pct.local', password: 'Suspended#1234',role: 'DEVELOPER',  status: 'SUSPENDED' },
];

async function main() {
  for (const u of USERS) {
    const hash = await hashPassword(u.password);
    await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), ' +
        'role = VALUES(role), status = VALUES(status)',
      [u.name, u.email, hash, u.role, u.status],
    );
    // eslint-disable-next-line no-console
    console.log(`seeded ${u.email} (${u.role}/${u.status})`);
  }
  await pool.end();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('seed failed:', err.message);
  process.exit(1);
});
