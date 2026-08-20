// =====================================================================
// SettingsPage — /settings
//
// Tabs:
//   • Profile       — own name / email / title (delegates to userService)
//   • Preferences   — theme / density / locale / date-time / motion
//   • Security      — change password (mock) + active sessions (mock)
//   • System        — admin-only workspace summary (read-only)
//
// The page owns local "active section" state. Default is Profile. The
// URL is not synced for now to keep the implementation small; the
// page is short and the back stack from anywhere else lands users on
// Profile, which is the right default.
// =====================================================================

import { useCallback, useMemo, useState } from 'react';
import PageContainer from '../../layouts/PageContainer';
import Card from '../../components/ui/Card';
import SettingsNav from '../../components/settings/SettingsNav';
import ProfileSection from '../../components/settings/ProfileSection';
import PreferencesSection from '../../components/settings/PreferencesSection';
import SecuritySection from '../../components/settings/SecuritySection';
import SystemSection from '../../components/settings/SystemSection';
import { useAuth } from '../../context/AuthContext';
import { isAdmin, hasPermission } from '../../utils/permissions';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: 'users' },
  { id: 'preferences', label: 'Preferences', icon: 'settings' },
  { id: 'security', label: 'Security', icon: 'shield' },
  { id: 'system', label: 'System', icon: 'shield', requiresAdmin: true },
];

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [active, setActive] = useState('profile');

  const sections = useMemo(
    () => SECTIONS.map((s) => ({ ...s, viewer: user })),
    [user],
  );

  const handleProfileUpdated = useCallback(
    (updated) => {
      if (!updated || !user) return;
      // Keep the AuthContext in sync so the sidebar/avatar reflect the
      // new name without waiting for a full re-login.
      if (
        updated.name !== user.name ||
        updated.email !== user.email ||
        updated.title !== user.title
      ) {
        const next = { ...user, ...updated };
        setUser(next);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('pct_auth_user', JSON.stringify(next));
        }
      }
    },
    [user, setUser],
  );

  const canUpdate = hasPermission(user, 'settings.update');

  return (
    <PageContainer
      title="Settings"
      subtitle="Workspace and account preferences"
    >
      {!canUpdate && (
        <Card padding="sm" className="text-xs text-text-muted">
          You can view your settings, but only administrators can change
          workspace-wide preferences.
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4">
        <aside className="lg:sticky lg:top-4 self-start">
          <SettingsNav
            sections={sections}
            active={active}
            onChange={setActive}
          />
        </aside>

        <div className="flex flex-col gap-4">
          {active === 'profile' && (
            <ProfileSection user={user} onProfileUpdated={handleProfileUpdated} />
          )}
          {active === 'preferences' && <PreferencesSection user={user} />}
          {active === 'security' && <SecuritySection user={user} />}
          {active === 'system' && isAdmin(user) && <SystemSection user={user} />}
        </div>
      </div>
    </PageContainer>
  );
}