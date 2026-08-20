// =====================================================================
// ProfileSection — name, email, title editing on the current user.
//
// Permission gating: editable by the user themselves. The owner is
// always shown their own profile; admins edit other users via the
// Users page.
//
// Reuses `userService.update()` for the mutation so the same email
// uniqueness rules and audit trail apply — the Settings page is a
// thinner surface over the same service.
// =====================================================================

import { useEffect, useState } from 'react';
import Card, { CardHeader, CardTitle, CardBody, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import EmptyState from '../ui/EmptyState';
import ErrorState from '../ui/ErrorState';
import Icon from '../ui/Icon';
import { useToast } from '../../context/ToastContext';
import settingsService from '../../services/settingsService';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function diffProfile(initial, next) {
  const changes = {};
  ['name', 'email', 'title'].forEach((key) => {
    if ((next[key] ?? '') !== (initial[key] ?? '')) {
      changes[key] = next[key];
    }
  });
  return changes;
}

export default function ProfileSection({ user, onProfileUpdated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    title: user?.title || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      title: user?.title || '',
    });
    setErrors({});
  }, [user?.id]);

  if (!user) {
    return (
      <Card padding="md">
        <EmptyState
          icon={<Icon name="users" size="md" />}
          title="No active user"
          description="Sign in to manage your profile."
        />
      </Card>
    );
  }

  const dirty = !!Object.keys(diffProfile(user, form)).length;
  const dirtyChanges = diffProfile(user, form);

  const validate = () => {
    const next = {};
    if (!form.name || form.name.trim().length < 2) {
      next.name = 'Name must be at least 2 characters.';
    }
    if (!form.email || !emailRe.test(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (form.title && form.title.length > 80) {
      next.title = 'Title must be 80 characters or fewer.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setLoadError(null);
    try {
      const res = await settingsService.updateProfile({
        userId: user.id,
        payload: dirtyChanges,
        actor: user,
      });
      toast.success('Profile updated.');
      onProfileUpdated?.(res.data);
    } catch (err) {
      const message = err?.message || 'Could not update profile.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      name: user.name || '',
      email: user.email || '',
      title: user.title || '',
    });
    setErrors({});
    setLoadError(null);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card padding="md">
        <CardHeader>
          <CardTitle subtitle="Your name, email, and title as they appear across the workspace.">
            Profile
          </CardTitle>
        </CardHeader>
      <CardBody>
        {loadError && (
          <ErrorState
            title="Could not save"
            description={loadError}
            className="mb-4"
          />
        )}

        <div className="flex items-center gap-3 mb-4">
          <Avatar user={user} size="lg" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text truncate">{user.name}</div>
            <div className="text-xs text-text-muted truncate">{user.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            error={errors.name}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            error={errors.email}
            helperText="Used for sign-in and notifications."
            required
          />
          <Input
            label="Job title"
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            error={errors.title}
            helperText="Shown next to your name in the workspace. Max 80 characters."
            className="md:col-span-2"
          />
        </div>
      </CardBody>
      <CardFooter>
        {dirty && (
          <span className="text-2xs uppercase tracking-wide text-text-muted self-center mr-auto">
            Unsaved changes
          </span>
        )}
        <Button variant="ghost" onClick={handleReset} disabled={!dirty || submitting}>
          Reset
        </Button>
        <Button type="submit" disabled={!dirty} loading={submitting}>
          Save profile
        </Button>
      </CardFooter>
    </Card>
    </form>
  );
}
