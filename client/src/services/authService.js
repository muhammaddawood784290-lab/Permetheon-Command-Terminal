// =====================================================================
// authService — frontend facade for authentication.
//
// Real implementation will POST /api/auth/login. During this phase we
// accept any non-empty credentials and return a mock user. This service
// is the only place that knows about the mock auth state, so swapping
// in real Express endpoints in Phase 2 is a localized change.
// =====================================================================

import { ok, fail } from './api';
import { currentUser, mockUsers } from '../mock/mockData';

const AUTH_STORAGE_KEY = 'pct_auth_user';
const AUTH_TOKEN_KEY = 'pct_auth_token';

export const authService = {
  async login({ email, password }) {
    if (!email || !password) {
      return fail('Email and password are required.', 400);
    }

    // Phase 2: replace with POST /api/auth/login
    // Phase 1: simulate delay and accept any non-empty credentials
    const matched = mockUsers.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!matched) {
      // For demo, default to current user when password is provided
      // but we still accept the user to demonstrate the UI flow.
      const fallback = currentUser;
      return ok({ user: fallback, token: 'mock-token-' + fallback.id }).then((res) => {
        authService._persist(res.data);
        return res;
      });
    }

    const result = await ok({ user: matched, token: 'mock-token-' + matched.id });
    authService._persist(result.data);
    return result;
  },

  async logout() {
    // Phase 2: replace with POST /api/auth/logout
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    return ok({ success: true });
  },

  async getCurrentUser() {
    // Phase 2: replace with GET /api/auth/me
    if (typeof window === 'undefined') return ok({ user: null });
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return ok({ user: null });
    try {
      return ok({ user: JSON.parse(raw) });
    } catch {
      return ok({ user: null });
    }
  },

  /**
   * Returns the persisted user synchronously (used by AuthProvider to
   * avoid an empty flash of the login screen on refresh).
   */
  getStoredUser() {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  _persist(data) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
    window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
  },
};

export default authService;
