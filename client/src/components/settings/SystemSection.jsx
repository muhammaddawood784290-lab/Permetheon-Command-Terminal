// =====================================================================
// SystemSection — admin-only workspace overview.
//
// Renders a read-only summary of user counts by role, plus the role
// legend. No mutation surface here — per ROLE_PERMESSIONS.md, a fully
// dynamic permission editor is out of scope for V1.
// =====================================================================

import { useEffect, useState } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../ui/Card';
import LoadingState from '../ui/LoadingState';
import ErrorState from '../ui/ErrorState';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';
import { RoleBadge } from '../ui/StatusBadge';
import settingsService from '../../services/settingsService';
import { ROLE, ROLE_LABELS } from '../../utils/constants';

function StatTile({ label, value, tone = 'default' }) {
  const tones = {
    default: 'border-border bg-bg-surface',
    admin: 'border-danger/40 bg-danger-soft',
    lead: 'border-warning/40 bg-warning-soft',
    dev: 'border-info/40 bg-info-soft',
  };
  return (
    <div className={`rounded-md border p-3 ${tones[tone] || tones.default}`}>
      <div className="text-2xs uppercase tracking-wide text-text-muted">{label}</div>
      <div className="text-xl font-semibold text-text mt-1">{value}</div>
    </div>
  );
}

export default function SystemSection({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    settingsService
      .getSystemSettings({ actor: user })
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Could not load system settings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || user.role !== ROLE.ADMIN) {
    return (
      <Card padding="md">
        <EmptyState
          icon={<Icon name="shield" size="md" />}
          title="Administrator only"
          description="System settings are visible to administrators."
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card padding="md">
        <CardHeader>
          <CardTitle subtitle="A live snapshot of the workspace.">
            Workspace summary
          </CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <LoadingState rows={3} />
          ) : error ? (
            <ErrorState title="Could not load" description={error} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile label="Users" value={data?.totals?.users ?? 0} />
              <StatTile label="Active" value={data?.totals?.activeUsers ?? 0} />
              <StatTile
                label="Admins"
                value={data?.totals?.admins ?? 0}
                tone="admin"
              />
              <StatTile
                label="Team leads"
                value={data?.totals?.teamLeads ?? 0}
                tone="lead"
              />
            </div>
          )}
        </CardBody>
      </Card>

      <Card padding="md">
        <CardHeader>
          <CardTitle subtitle="Roles are controlled centrally. V1 does not allow custom permissions.">
            Roles
          </CardTitle>
        </CardHeader>
        <CardBody>
          {loading ? (
            <LoadingState rows={3} />
          ) : error ? (
            <ErrorState title="Could not load" description={error} />
          ) : (
            <ul className="divide-y divide-border">
              {(data?.roles || []).map((r) => (
                <li key={r.value} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <RoleBadge role={r.value} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text">{ROLE_LABELS[r.value]}</div>
                      <div className="text-xs text-text-muted">{r.count} user{r.count === 1 ? '' : 's'}</div>
                    </div>
                  </div>
                  <span className="text-2xs uppercase tracking-wide text-text-muted">
                    Read-only
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
