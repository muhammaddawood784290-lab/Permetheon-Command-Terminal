// =====================================================================
// SecuritySection — change password (mock) + active sessions (mock).
//
// Both operations are mocked in this phase. The UI is kept honest with
// copy that says "demo" / "mock" so the user knows nothing is persisted
// server-side. The validation logic is real and matches the expected
// production shape so the swap-out is localized.
// =====================================================================

import { useEffect, useMemo, useState } from 'react';
import Card, { CardHeader, CardTitle, CardBody, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import Icon from '../ui/Icon';
import { useToast } from '../../context/ToastContext';
import settingsService from '../../services/settingsService';
import { formatRelativeTime } from '../../utils/formatDate';

const DEVICE_ICONS = {
  desktop: 'dashboard',
  mobile: 'refresh',
  cli: 'bolt',
};

function passwordIssues(value) {
  if (!value) return null;
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (value.length > 128) return 'Password must be 128 characters or fewer.';
  if (!/[a-zA-Z]/.test(value)) return 'Password must include at least one letter.';
  if (!/[0-9]/.test(value)) return 'Password must include at least one number.';
  return null;
}

function PasswordForm({ user }) {
  const toast = useToast();
  const [form, setForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const newPwdIssue = useMemo(() => passwordIssues(form.next), [form.next]);

  const reset = () => {
    setForm({ current: '', next: '', confirm: '' });
    setErrors({});
    setLoadError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.current) next.current = 'Current password is required.';
    if (newPwdIssue) next.next = newPwdIssue;
    if (form.next !== form.confirm) next.confirm = 'Confirmation does not match the new password.';
    if (form.current && form.next && form.current === form.next) {
      next.next = 'New password must differ from the current one.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setLoadError(null);
    try {
      await settingsService.changePassword({
        userId: user.id,
        currentPassword: form.current,
        newPassword: form.next,
        confirmPassword: form.confirm,
      });
      toast.success('Password changed (demo).');
      reset();
    } catch (err) {
      const message = err?.message || 'Could not change password.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
    <Card padding="md">
      <CardHeader>
        <CardTitle subtitle="Mock implementation — passwords are not persisted in this phase.">
          Change password
        </CardTitle>
      </CardHeader>
      <CardBody>
        {loadError && (
          <ErrorState
            title="Could not change password"
            description={loadError}
            className="mb-4"
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Current password"
            type="password"
            value={form.current}
            onChange={(e) => setForm((s) => ({ ...s, current: e.target.value }))}
            error={errors.current}
            autoComplete="current-password"
            required
          />
          <Input
            label="New password"
            type="password"
            value={form.next}
            onChange={(e) => setForm((s) => ({ ...s, next: e.target.value }))}
            error={errors.next}
            helperText="At least 8 characters with a letter and a number."
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={form.confirm}
            onChange={(e) => setForm((s) => ({ ...s, confirm: e.target.value }))}
            error={errors.confirm}
            autoComplete="new-password"
            required
          />
        </div>
      </CardBody>
      <CardFooter>
        <span className="mr-auto text-2xs uppercase tracking-wide text-text-muted">
          Demo only
        </span>
        <Button variant="ghost" onClick={reset} disabled={submitting}>
          Clear
        </Button>
        <Button type="submit" loading={submitting}>
          Change password
        </Button>
      </CardFooter>
    </Card>
    </form>
  );
}

function SessionsList({ user, onChange }) {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [acting, setActing] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await settingsService.getSessions({ userId: user.id });
      setSessions(res.data || []);
    } catch (err) {
      setError(err?.message || 'Could not load sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleRevoke = async (sessionId) => {
    setActing(true);
    try {
      await settingsService.revokeSession({ userId: user.id, sessionId });
      toast.success('Session revoked.');
      await load();
      onChange?.();
    } catch (err) {
      toast.error(err?.message || 'Could not revoke session.');
    } finally {
      setActing(false);
      setConfirm(null);
    }
  };

  const handleRevokeAll = async () => {
    setActing(true);
    try {
      const res = await settingsService.revokeAllOtherSessions({ userId: user.id });
      const count = (res.data?.revoked || []).length;
      toast.success(
        count === 0
          ? 'No other sessions to revoke.'
          : `Revoked ${count} other session${count === 1 ? '' : 's'}.`,
      );
      await load();
      onChange?.();
    } catch (err) {
      toast.error(err?.message || 'Could not revoke sessions.');
    } finally {
      setActing(false);
      setConfirm(null);
    }
  };

  const others = sessions.filter((s) => !s.isCurrent);

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle subtitle="Mock sessions. Real session management ships with the auth backend.">
          Active sessions
        </CardTitle>
        {others.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="logout" size="sm" />}
            onClick={() => setConfirm({ type: 'all' })}
            disabled={acting}
          >
            Revoke all other sessions
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {loading ? (
          <LoadingState rows={3} />
        ) : error ? (
          <ErrorState
            title="Could not load sessions"
            description={error}
            actionLabel="Retry"
            onAction={load}
          />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<Icon name="shield" size="md" />}
            title="No active sessions"
            description="Sign in to start a session."
          />
        ) : (
          <ul className="divide-y divide-border">
            {sessions.map((s) => (
              <li key={s.id} className="py-3 flex items-start gap-3">
                <span className="mt-0.5 h-9 w-9 rounded-md bg-bg-elevated flex items-center justify-center text-text-muted">
                  <Icon name={DEVICE_ICONS[s.device] || 'shield'} size="sm" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-text">{s.deviceLabel}</span>
                    {s.isCurrent && (
                      <span className="text-2xs uppercase tracking-wide text-success-light border border-success/40 bg-success-soft rounded px-1.5 py-0.5">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted truncate">
                    {s.location} · {s.ip}
                  </div>
                  <div className="text-2xs text-text-muted">
                    Last active {formatRelativeTime(s.lastActiveAt)} · Started{' '}
                    {formatRelativeTime(s.createdAt)}
                  </div>
                </div>
                {!s.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Icon name="trash" size="sm" />}
                    onClick={() => setConfirm({ type: 'one', sessionId: s.id, label: s.deviceLabel })}
                    disabled={acting}
                  >
                    Revoke
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
      <ConfirmDialog
        open={confirm?.type === 'one'}
        title="Revoke session?"
        description={
          confirm?.type === 'one'
            ? `End the session for ${confirm.label}? The device will need to sign in again.`
            : ''
        }
        confirmLabel="Revoke session"
        variant="danger"
        loading={acting}
        onConfirm={() => handleRevoke(confirm.sessionId)}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.type === 'all'}
        title="Revoke all other sessions?"
        description="This will end every other session. You will stay signed in on this device."
        confirmLabel="Revoke all"
        variant="danger"
        loading={acting}
        onConfirm={handleRevokeAll}
        onClose={() => setConfirm(null)}
      />
    </Card>
  );
}

export default function SecuritySection({ user }) {
  if (!user) return null;
  return (
    <div className="flex flex-col gap-4">
      <PasswordForm user={user} />
      <SessionsList user={user} />
    </div>
  );
}
