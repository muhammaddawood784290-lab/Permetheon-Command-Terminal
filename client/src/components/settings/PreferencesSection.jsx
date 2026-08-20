// =====================================================================
// PreferencesSection — workbench ergonomics (theme, density, locale,
// date/time). Reads/writes via settingsService.updatePreferences. All
// options are whitelisted in the service so unknown enum values are
// rejected before they can be persisted.
//
// Dirty-state tracking stays local: the form is rendered from the
// loaded values, and the Reset button restores the server snapshot.
// =====================================================================

import { useEffect, useState } from 'react';
import Card, { CardHeader, CardTitle, CardBody, CardFooter } from '../ui/Card';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import Button from '../ui/Button';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';
import { useToast } from '../../context/ToastContext';
import settingsService, {
  THEME_OPTIONS,
  DENSITY_OPTIONS,
  LANGUAGE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  WEEK_STARTS_ON_OPTIONS,
} from '../../services/settingsService';

const DEFAULT_PREFS = {
  theme: 'system',
  density: 'comfortable',
  language: 'en-US',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  weekStartsOn: 'monday',
  reduceMotion: false,
  showAvatars: true,
};

export default function PreferencesSection({ user }) {
  const toast = useToast();
  const [initial, setInitial] = useState(null);
  const [form, setForm] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    settingsService
      .getPreferences({ userId: user.id })
      .then((res) => {
        if (cancelled) return;
        const next = { ...DEFAULT_PREFS, ...res.data };
        setInitial(next);
        setForm(next);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err?.message || 'Could not load preferences.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const dirty = initial && JSON.stringify(form) !== JSON.stringify(initial);

  const updateField = (key, value) => {
    setForm((s) => ({ ...s, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dirty || !user) return;
    setSubmitting(true);
    setLoadError(null);
    try {
      const res = await settingsService.updatePreferences({
        userId: user.id,
        preferences: form,
        actor: user,
      });
      const next = { ...DEFAULT_PREFS, ...res.data };
      setInitial(next);
      setForm(next);
      toast.success('Preferences saved.');
    } catch (err) {
      const message = err?.message || 'Could not save preferences.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setResetting(true);
    setLoadError(null);
    try {
      const res = await settingsService.resetPreferences({ userId: user.id, actor: user });
      const next = { ...DEFAULT_PREFS, ...res.data };
      setInitial(next);
      setForm(next);
      toast.info('Preferences restored to defaults.');
    } catch (err) {
      const message = err?.message || 'Could not reset preferences.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setResetting(false);
    }
  };

  const handleRevert = () => {
    if (initial) setForm(initial);
    setLoadError(null);
  };

  if (loading) {
    return (
      <Card padding="md">
        <CardHeader>
          <CardTitle subtitle="Personalize how the workspace looks and feels.">
            Preferences
          </CardTitle>
        </CardHeader>
        <CardBody>
          <LoadingState rows={4} />
        </CardBody>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
    <Card padding="md">
      <CardHeader>
        <CardTitle subtitle="Personalize how the workspace looks and feels.">
          Preferences
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Theme"
            value={form.theme}
            onChange={(e) => updateField('theme', e.target.value)}
            options={THEME_OPTIONS.map((v) => ({
              value: v,
              label: v.charAt(0).toUpperCase() + v.slice(1),
            }))}
            helperText="Follows your operating system when set to System."
          />
          <Select
            label="Density"
            value={form.density}
            onChange={(e) => updateField('density', e.target.value)}
            options={DENSITY_OPTIONS.map((v) => ({
              value: v,
              label: v.charAt(0).toUpperCase() + v.slice(1),
            }))}
            helperText="Compact fits more rows on each screen."
          />
          <Select
            label="Language"
            value={form.language}
            onChange={(e) => updateField('language', e.target.value)}
            options={LANGUAGE_OPTIONS.map((v) => ({ value: v, label: v }))}
            helperText="Affects number, date, and time formatting."
          />
          <Select
            label="Date format"
            value={form.dateFormat}
            onChange={(e) => updateField('dateFormat', e.target.value)}
            options={DATE_FORMAT_OPTIONS.map((v) => ({ value: v, label: v }))}
          />
          <Select
            label="Time format"
            value={form.timeFormat}
            onChange={(e) => updateField('timeFormat', e.target.value)}
            options={TIME_FORMAT_OPTIONS.map((v) => ({
              value: v,
              label: v === '24h' ? '24-hour' : '12-hour',
            }))}
          />
          <Select
            label="Week starts on"
            value={form.weekStartsOn}
            onChange={(e) => updateField('weekStartsOn', e.target.value)}
            options={WEEK_STARTS_ON_OPTIONS.map((v) => ({
              value: v,
              label: v.charAt(0).toUpperCase() + v.slice(1),
            }))}
          />
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Checkbox
            checked={form.reduceMotion}
            onChange={(e) => updateField('reduceMotion', e.target.checked)}
            label="Reduce motion"
            helperText="Disables non-essential animations and transitions."
          />
          <Checkbox
            checked={form.showAvatars}
            onChange={(e) => updateField('showAvatars', e.target.checked)}
            label="Show avatars"
            helperText="Display colored initials next to user names."
          />
        </div>
      </CardBody>
      <CardFooter>
        {dirty ? (
          <span className="text-2xs uppercase tracking-wide text-text-muted self-center mr-auto">
            Unsaved changes
          </span>
        ) : (
          <span className="mr-auto" />
        )}
        <Button
          variant="ghost"
          onClick={handleRevert}
          disabled={!dirty || submitting || resetting}
        >
          Revert
        </Button>
        <Button
          variant="ghost"
          onClick={handleReset}
          loading={resetting}
          disabled={submitting}
        >
          Restore defaults
        </Button>
        <Button type="submit" disabled={!dirty} loading={submitting}>
          Save preferences
        </Button>
      </CardFooter>
    </Card>
    </form>
  );
}
