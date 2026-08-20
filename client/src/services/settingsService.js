// =====================================================================
// settingsService — frontend facade for application and user settings.
//
// Phase 1: served entirely from in-memory state. Preferences are stored
// per-user in `mockUserPreferences` (a Map keyed by userId). Sessions
// are computed from a fixed mock set so the UI can render a realistic
// list without real authentication back-end. Password changes validate
// the inputs locally and return a success response — the operation is
// labelled as mock in the dialog so users don't get a false sense of
// server-side persistence.
//
// Phase 2: swap each method's body for its Express counterpart. The
// public shape (input/output) stays stable so component code does not
// change.
//
// Sections handled here:
//   • Profile (name/email/title) — delegated to userService.update()
//   • Preferences (theme/date/time/language/density) — persisted here
//   • Security (change password, sessions) — mocked, validated
//   • System (admin-only) — read-only permission listing
// =====================================================================

import { ok, fail } from './api';
import userService from './userService';
import { mockUsers } from '../mock/mockData';
import { ACTIVITY_ACTION, ROLE, ROLE_LABELS } from '../utils/constants';
import { recordActivity } from './activityHelpers';

// ----- Preference schema ---------------------------------------------
// Anything not in this allowlist is rejected by updatePreferences() so
// the persistence layer can never grow fields we did not design for.
// The keys are the *external* preference names (theme, density, …) and
// are the only allowed payloads from callers.
const KEY = Object.freeze({
  THEME: 'theme',
  DENSITY: 'density',
  LANGUAGE: 'language',
  DATE_FORMAT: 'dateFormat',
  TIME_FORMAT: 'timeFormat',
  WEEK_STARTS_ON: 'weekStartsOn',
  REDUCE_MOTION: 'reduceMotion',
  SHOW_AVATARS: 'showAvatars',
});

const PREFERENCE_KEYS = Object.freeze(Object.values(KEY));

export const THEME_OPTIONS = ['light', 'dark', 'system'];
export const DENSITY_OPTIONS = ['comfortable', 'compact'];
export const LANGUAGE_OPTIONS = ['en-US', 'en-GB', 'ar-SA'];
export const DATE_FORMAT_OPTIONS = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'DD MMM YYYY'];
export const TIME_FORMAT_OPTIONS = ['24h', '12h'];
export const WEEK_STARTS_ON_OPTIONS = ['sunday', 'monday'];

export const PREFERENCE_LABELS = {
  theme: 'Theme',
  density: 'Density',
  language: 'Language',
  dateFormat: 'Date format',
  timeFormat: 'Time format',
  weekStartsOn: 'Week starts on',
  reduceMotion: 'Reduce motion',
  showAvatars: 'Show avatars',
};

// ----- Preference defaults -------------------------------------------
// Defaults are intentionally per-user, not per-system, so the
// `resetPreferences` action is meaningful (restores the per-user
// baseline).
const DEFAULT_PREFERENCES = {
  theme: 'system',
  density: 'comfortable',
  language: 'en-US',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  weekStartsOn: 'monday',
  reduceMotion: false,
  showAvatars: true,
};

// ----- Mock per-user preferences store -------------------------------
// Backed by a plain Map so it survives within a session. The auth
// service already keeps the active user in localStorage; we keep
// preferences in memory only — Phase 2 will replace this with a
// per-user GET/PUT against /api/settings.
const preferencesStore = new Map();

function getStoreFor(userId) {
  if (!userId) return { ...DEFAULT_PREFERENCES };
  if (!preferencesStore.has(userId)) {
    preferencesStore.set(userId, { ...DEFAULT_PREFERENCES });
  }
  return preferencesStore.get(userId);
}

// ----- Mock sessions --------------------------------------------------
// Sessions are not persisted anywhere — they are generated fresh per
// request so the user always sees a populated list. The "current"
// session is the auth token read from localStorage; its id is the
// stored token when available or a deterministic fallback.
const SESSION_DURATIONS = {
  desktop: { label: 'macOS · Chrome', userAgent: 'Macintosh' },
  mobile: { label: 'iOS · Safari', userAgent: 'iPhone' },
  cli: { label: 'CLI · pct-cli', userAgent: 'CLI' },
};

function buildMockSessions(currentUserId) {
  const now = Date.now();
  const HOURS = (n) => new Date(now - n * 60 * 60 * 1000).toISOString();
  const DAYS = (n) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();
  const seen = new Date(now).toISOString();
  const currentToken =
    (typeof window !== 'undefined' && window.localStorage.getItem('pct_auth_token')) ||
    `mock-token-${currentUserId}`;
  const ip = '10.0.0.42';
  return [
    {
      id: currentToken,
      device: 'desktop',
      deviceLabel: SESSION_DURATIONS.desktop.label,
      location: 'Lahore, Pakistan',
      ip,
      isCurrent: true,
      lastActiveAt: seen,
      createdAt: DAYS(0),
    },
    {
      id: `session-${currentUserId}-mobile`,
      device: 'mobile',
      deviceLabel: SESSION_DURATIONS.mobile.label,
      location: 'Lahore, Pakistan',
      ip: '10.0.0.51',
      isCurrent: false,
      lastActiveAt: HOURS(4),
      createdAt: DAYS(3),
    },
    {
      id: `session-${currentUserId}-cli`,
      device: 'cli',
      deviceLabel: SESSION_DURATIONS.cli.label,
      location: 'Hostinger · us-east',
      ip: '49.12.220.8',
      isCurrent: false,
      lastActiveAt: DAYS(1),
      createdAt: DAYS(14),
    },
  ];
}

// ----- Validation helpers --------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value) {
  if (!value) return 'Email is required.';
  if (!EMAIL_RE.test(value)) return 'Enter a valid email address.';
  return null;
}

function validatePassword(value) {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (value.length > 128) return 'Password must be 128 characters or fewer.';
  if (!/[a-zA-Z]/.test(value)) return 'Password must include at least one letter.';
  if (!/[0-9]/.test(value)) return 'Password must include at least one number.';
  return null;
}

// ----- Public service ------------------------------------------------
export const settingsService = {
  // ---------- Preferences --------------------------------------------
  /**
   * Returns the user's preferences. Falls back to the schema default
   * for any key that has not been set yet.
   */
  async getPreferences({ userId }) {
    if (!userId) return fail('userId is required.', 400);
    const stored = preferencesStore.get(userId) || {};
    return ok({ ...DEFAULT_PREFERENCES, ...stored });
  },

  /**
   * Apply a partial preferences update. Unrecognised keys are rejected
   * with a 400 so we fail loudly instead of silently widening the
   * schema. Unknown enum values are also rejected.
   */
  async updatePreferences({ userId, preferences, actor }) {
    if (!userId) return fail('userId is required.', 400);
    if (!preferences || typeof preferences !== 'object') {
      return fail('preferences object is required.', 400);
    }
    const current = getStoreFor(userId);
    const next = { ...current };

    const invalidKeys = [];
    for (const [key, value] of Object.entries(preferences)) {
      if (!PREFERENCE_KEYS.includes(key)) {
        invalidKeys.push(key);
        continue;
      }
      switch (key) {
        case KEY.THEME:
          if (!THEME_OPTIONS.includes(value)) {
            return fail(`Invalid theme value. Pick one of ${THEME_OPTIONS.join(', ')}.`, 400);
          }
          break;
        case KEY.DENSITY:
          if (!DENSITY_OPTIONS.includes(value)) {
            return fail(`Invalid density value. Pick one of ${DENSITY_OPTIONS.join(', ')}.`, 400);
          }
          break;
        case KEY.LANGUAGE:
          if (!LANGUAGE_OPTIONS.includes(value)) {
            return fail(`Invalid language value. Pick one of ${LANGUAGE_OPTIONS.join(', ')}.`, 400);
          }
          break;
        case KEY.DATE_FORMAT:
          if (!DATE_FORMAT_OPTIONS.includes(value)) {
            return fail(`Invalid date format. Pick one of ${DATE_FORMAT_OPTIONS.join(', ')}.`, 400);
          }
          break;
        case KEY.TIME_FORMAT:
          if (!TIME_FORMAT_OPTIONS.includes(value)) {
            return fail(`Invalid time format. Pick one of ${TIME_FORMAT_OPTIONS.join(', ')}.`, 400);
          }
          break;
        case KEY.WEEK_STARTS_ON:
          if (!WEEK_STARTS_ON_OPTIONS.includes(value)) {
            return fail(`Invalid week start. Pick one of ${WEEK_STARTS_ON_OPTIONS.join(', ')}.`, 400);
          }
          break;
        case KEY.REDUCE_MOTION:
        case KEY.SHOW_AVATARS:
          if (typeof value !== 'boolean') {
            return fail(`'${key}' must be a boolean.`, 400);
          }
          break;
        default:
          break;
      }
      next[key] = value;
    }

    if (invalidKeys.length > 0) {
      return fail(`Unknown preference key(s): ${invalidKeys.join(', ')}.`, 400);
    }

    const before = { ...current };
    preferencesStore.set(userId, next);

    const target = mockUsers.find((u) => u.id === userId);
    if (target && actor) {
      recordActivity({
        action: ACTIVITY_ACTION.USER_UPDATED,
        actor,
        targetType: 'user',
        targetId: target.id,
        targetLabel: target.name,
        summary: `${actor.name} updated their preferences`,
        metadata: { before, after: next, scope: 'preferences' },
      });
    }

    return ok({ ...next });
  },

  /**
   * Restore the per-user preferences to the schema defaults. Audit the
   * change so admins can see who reset their preferences.
   */
  async resetPreferences({ userId, actor }) {
    if (!userId) return fail('userId is required.', 400);
    const before = { ...(preferencesStore.get(userId) || {}) };
    preferencesStore.set(userId, { ...DEFAULT_PREFERENCES });
    const target = mockUsers.find((u) => u.id === userId);
    if (target && actor) {
      recordActivity({
        action: ACTIVITY_ACTION.USER_UPDATED,
        actor,
        targetType: 'user',
        targetId: target.id,
        targetLabel: target.name,
        summary: `${actor.name} reset their preferences to defaults`,
        metadata: { before, after: { ...DEFAULT_PREFERENCES }, scope: 'preferences' },
      });
    }
    return ok({ ...DEFAULT_PREFERENCES });
  },

  // ---------- Profile ------------------------------------------------
  /**
   * Thin wrapper around userService.update that scopes the payload to
   * the profile fields editable from the Settings page. Email and
   * title share the same uniqueness rules as the Users page.
   */
  async updateProfile({ userId, payload, actor }) {
    if (!userId) return fail('userId is required.', 400);
    const patch = {};
    if (payload?.name !== undefined) {
      const name = String(payload.name).trim();
      if (!name || name.length < 2) return fail('Name must be at least 2 characters.', 400);
      patch.name = name;
    }
    if (payload?.email !== undefined) {
      const email = String(payload.email).trim();
      const emailError = validateEmail(email);
      if (emailError) return fail(emailError, 400);
      patch.email = email;
    }
    if (payload?.title !== undefined) {
      const title = String(payload.title).trim();
      if (title.length > 80) return fail('Title must be 80 characters or fewer.', 400);
      patch.title = title;
    }
    if (Object.keys(patch).length === 0) {
      return fail('No profile fields to update.', 400);
    }
    return userService.update(userId, patch, actor);
  },

  // ---------- Security -----------------------------------------------
  /**
   * Mock password change. Validates the inputs locally and returns a
   * success payload; the operation is intentionally not persisted — the
   * UI surfaces this fact in the dialog copy so users understand what
   * the action will and will not do.
   */
  async changePassword({ userId, currentPassword, newPassword, confirmPassword }) {
    if (!userId) return fail('userId is required.', 400);
    if (!currentPassword) return fail('Current password is required.', 400);

    const newErr = validatePassword(newPassword);
    if (newErr) return fail(newErr, 400);

    if (newPassword !== confirmPassword) {
      return fail('New password and confirmation do not match.', 400);
    }
    if (currentPassword === newPassword) {
      return fail('New password must differ from the current one.', 400);
    }

    // We deliberately do NOT persist anything here. The mock just
    // mirrors the contract a real backend would expose.
    return ok({
      changedAt: new Date().toISOString(),
      mock: true,
    });
  },

  /**
   * List the (mock) active sessions for the current user. The session
   * matching the current auth token is flagged `isCurrent` so the UI
   * can disable the revoke button for it.
   */
  async getSessions({ userId }) {
    if (!userId) return fail('userId is required.', 400);
    return ok(buildMockSessions(userId));
  },

  /**
   * Mock single-session revoke. Refuses to terminate the current
   * session — callers must use the auth logout for that path.
   */
  async revokeSession({ userId, sessionId }) {
    if (!userId) return fail('userId is required.', 400);
    if (!sessionId) return fail('sessionId is required.', 400);
    const sessions = buildMockSessions(userId);
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return fail('Session not found.', 404);
    if (target.isCurrent) {
      return fail('Use the Sign-Out button to end your current session.', 409);
    }
    return ok({ revoked: sessionId });
  },

  /**
   * Mock bulk revoke — every session except the current one.
   */
  async revokeAllOtherSessions({ userId }) {
    if (!userId) return fail('userId is required.', 400);
    const sessions = buildMockSessions(userId);
    const others = sessions.filter((s) => !s.isCurrent);
    return ok({ revoked: others.map((s) => s.id) });
  },

  // ---------- System (admin-only) ------------------------------------
  /**
   * Returns the role/permission matrix for the SYSTEM tab. Admin-only.
   * The UI uses this to render a read-only summary; no mutations are
   * exposed because ROLE_PERMESSIONS.md states dynamic permission
   * editing is V2.
   */
  async getSystemSettings({ actor }) {
    if (!actor || actor.role !== ROLE.ADMIN) {
      return fail('System settings require administrator access.', 403);
    }
    const totals = {
      users: mockUsers.length,
      activeUsers: mockUsers.filter((u) => u.status === 'ACTIVE').length,
      admins: mockUsers.filter((u) => u.role === ROLE.ADMIN).length,
      teamLeads: mockUsers.filter((u) => u.role === ROLE.TEAM_LEAD).length,
      developers: mockUsers.filter((u) => u.role === ROLE.DEVELOPER).length,
    };
    const roles = Object.values(ROLE).map((value) => ({
      value,
      label: ROLE_LABELS[value],
      count: mockUsers.filter((u) => u.role === value).length,
    }));
    return ok({ totals, roles });
  },
};

export default settingsService;
