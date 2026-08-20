// =====================================================================
// UserActivitySection — recent activity entries for a single user.
// Filters the global activity log by actor (when the user is the actor)
// and by target (when the user is the target of a user-management
// event). Both sets are merged + de-duplicated so admins can see who
// did what to whom in one list.
// =====================================================================

import { useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardBody } from '../ui/Card';
import Avatar from '../ui/Avatar';
import EmptyState from '../ui/EmptyState';
import Icon from '../ui/Icon';
import { formatRelativeTime } from '../../utils/formatDate';
import {
  ACTIVITY_ACTION_LABELS,
} from '../../utils/constants';
import activityService from '../../services/activityService';

const USER_ACTIONS = new Set([
  'USER_CREATED',
  'USER_UPDATED',
  'USER_ROLE_CHANGED',
  'USER_DEACTIVATED',
  'USER_REACTIVATED',
  'USER_LOGIN',
  'USER_LOGOUT',
]);

export default function UserActivitySection({ user, entries, loading }) {
  const filtered = useMemo(() => {
    if (!entries || !user) return [];
    return entries
      .filter((entry) => {
        if (USER_ACTIONS.has(entry.action)) return true;
        return entry.actorId === user.id || entry.targetId === user.id;
      })
      .slice(0, 25);
  }, [entries, user]);

  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle subtitle={`Activity entries involving ${user?.name || 'this user'}.`}>
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-bg-hover rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icon name="activity" size="md" />}
            title="No activity yet"
            description="Actions on this user will appear here as they happen."
          />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((entry) => (
              <li key={entry.id} className="py-2 flex items-start gap-3">
                <Avatar
                  name={entry.actorName}
                  color={entry.actorRole === 'ADMIN' ? '#3b6ff4' : entry.actorRole === 'TEAM_LEAD' ? '#a16207' : '#15803d'}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text">
                    <span className="font-medium">{entry.actorName}</span>{' '}
                    <span className="text-text-secondary">
                      {ACTIVITY_ACTION_LABELS[entry.action] || entry.action}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted truncate">{entry.summary}</div>
                </div>
                <div className="text-2xs text-text-muted shrink-0">
                  {formatRelativeTime(entry.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

// Exposed for the page so the dialog can read whatever the activity
// service already fetched instead of triggering a second request.
export async function loadActivityForUser(user) {
  if (!user) return [];
  const res = await activityService.list({
    actor: user.id,
    limit: 50,
    sort: 'createdAt',
    order: 'desc',
  });
  // Augment with any entries where this user is the target of a user-* event.
  const allRes = await activityService.list({ limit: 200 });
  const targetEntries = (allRes.data?.items || []).filter(
    (e) => e.targetType === 'user' && e.targetId === user.id,
  );
  const seen = new Set();
  const merged = [];
  for (const e of [...(res.data?.items || []), ...targetEntries]) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    merged.push(e);
  }
  merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return merged;
}