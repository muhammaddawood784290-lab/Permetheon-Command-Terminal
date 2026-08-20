// =====================================================================
// src/routes/authRoutes.js
// Phase 2 auth surface (AUTH.md §41, API.md §6):
//   POST /login   — public, sets HttpOnly cookie
//   POST /logout  — public, clears cookie + DB session
//   GET  /me      — requires requireAuth
// =====================================================================

const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
