// =====================================================================
// UserStats — KPI cards summarizing the user list.
// Mirrors the project/task stat blocks: Total / Active / Inactive /
// role split. Stats load independently from the list so the page never
// shows stale KPIs when filters narrow the table.
// =====================================================================

import Card, { CardBody } from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import Icon from '../ui/Icon';
import { ROLE_LABELS, ROLE } from '../../utils/constants';

function StatCard({ label, value, icon, tone, loading }) {
  return (
    <Card padding="md" className="flex-1 min-w-[140px]">
      <CardBody>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-2xs uppercase tracking-wide text-text-muted">{label}</div>
            <div className="mt-1 text-xl font-semibold text-text">
              {loading ? <Skeleton className="h-6 w-12" /> : value}
            </div>
          </div>
          {icon && (
            <div className={`shrink-0 h-9 w-9 rounded-md flex items-center justify-center ${tone}`}>
              <Icon name={icon} size="sm" />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default function UserStats({ stats, loading }) {
  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const inactive = stats?.inactive ?? 0;
  const suspended = stats?.suspended ?? 0;
  const byRole = stats?.byRole || {};
  const admins = stats?.activeAdmins ?? byRole[ROLE.ADMIN] ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="Total users"
        value={total}
        icon="users"
        tone="bg-primary-500/10 text-primary-300"
        loading={loading}
      />
      <StatCard
        label="Active"
        value={active}
        icon="checkCircle"
        tone="bg-success-soft text-success-light"
        loading={loading}
      />
      <StatCard
        label="Inactive / suspended"
        value={inactive + suspended}
        icon="userX"
        tone="bg-bg-hover text-text-muted"
        loading={loading}
      />
      <StatCard
        label={`Active ${ROLE_LABELS[ROLE.ADMIN].toLowerCase()}s`}
        value={admins}
        icon="shield"
        tone="bg-danger-soft text-danger-light"
        loading={loading}
      />
    </div>
  );
}
