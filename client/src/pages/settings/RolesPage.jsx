// =====================================================================
// RolesPage — admin-only workspace overview of the role matrix.
//
// PCT V1 does not provide a dynamic permission editor
// (ROLE_PERMESSIONS.md). This page renders a read-only summary so
// administrators can audit which permissions each role holds without
// editing them. Editing lands with the future permission editor.
// =====================================================================

import { useEffect, useState } from 'react';
import PageContainer from '../../layouts/PageContainer';
import Card, { CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';
import { ROLE, ROLE_LABELS, ROLE_STYLES } from '../../utils/constants';
import { RoleBadge } from '../../components/ui/StatusBadge';

// Mirrors the matrix in client/src/utils/permissions.js. Keeping a copy
// here (instead of importing the PERMISSIONS map) lets us show the
// human-readable label rather than the raw permission string.
const ROLE_MATRIX = [
  {
    area: 'Projects',
    rows: [
      { permission: 'project.view', label: 'View projects', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER] },
      { permission: 'project.create', label: 'Create projects', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD] },
      { permission: 'project.update', label: 'Update projects', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD] },
      { permission: 'project.delete', label: 'Delete projects', roles: [ROLE.ADMIN] },
      { permission: 'project.archive', label: 'Archive projects', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD] },
      { permission: 'project.manageMembers', label: 'Manage project members', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD] },
    ],
  },
  {
    area: 'Tasks',
    rows: [
      { permission: 'task.view', label: 'View tasks', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER] },
      { permission: 'task.create', label: 'Create tasks', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD] },
      { permission: 'task.update', label: 'Update tasks', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER] },
      { permission: 'task.delete', label: 'Delete tasks', roles: [ROLE.ADMIN] },
      { permission: 'task.assign', label: 'Assign tasks', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD] },
      { permission: 'task.changeStatus', label: 'Change task status', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER] },
    ],
  },
  {
    area: 'Reviews',
    rows: [
      { permission: 'review.view', label: 'View reviews', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER] },
      { permission: 'review.submit', label: 'Submit for review', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER] },
      { permission: 'review.start', label: 'Start reviewing', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD] },
      { permission: 'review.approve', label: 'Approve reviews', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD] },
      { permission: 'review.requestRevision', label: 'Request revisions', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD] },
      { permission: 'review.assign', label: 'Assign reviewers', roles: [ROLE.ADMIN] },
    ],
  },
  {
    area: 'Users',
    rows: [
      { permission: 'user.view', label: 'View users', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD] },
      { permission: 'user.create', label: 'Create users', roles: [ROLE.ADMIN] },
      { permission: 'user.update', label: 'Update users', roles: [ROLE.ADMIN] },
      { permission: 'user.disable', label: 'Disable users', roles: [ROLE.ADMIN] },
      { permission: 'user.changeRole', label: 'Change roles', roles: [ROLE.ADMIN] },
    ],
  },
  {
    area: 'Settings',
    rows: [
      { permission: 'settings.view', label: 'View settings', roles: [ROLE.ADMIN, ROLE.TEAM_LEAD, ROLE.DEVELOPER] },
      { permission: 'settings.update', label: 'Update settings', roles: [ROLE.ADMIN] },
    ],
  },
];

export default function RolesPage() {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Simple mount gate so the loading state is visible for at least
    // one render and we don't briefly flash restricted content.
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  if (!user || !hasPermission(user, 'user.view')) {
    return (
      <PageContainer title="Roles & Permissions" subtitle="Access control matrix">
        <ErrorState
          title="You don't have access"
          description="Only administrators can view the role matrix."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Roles & Permissions"
      subtitle="Read-only access control matrix for the workspace"
    >
      {!ready ? (
        <Card padding="md">
          <LoadingState label="Loading role matrix…" />
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card padding="md">
            <CardHeader>
              <CardTitle subtitle="Permissions are centrally controlled. V1 does not allow custom permission editing.">
                Permission matrix
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-2xs uppercase tracking-wide text-text-muted">
                      <th className="py-2 pr-3 font-semibold">Capability</th>
                      {Object.values(ROLE).map((value) => (
                        <th key={value} className="py-2 pr-3 font-semibold">
                          <RoleBadge role={value} size="sm" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ROLE_MATRIX.flatMap((section) => [
                      <tr key={`h-${section.area}`} className="bg-bg-hover/40">
                        <td
                          colSpan={Object.values(ROLE).length + 1}
                          className="py-2 pr-3 text-xs uppercase tracking-wide text-text-muted font-semibold"
                        >
                          {section.area}
                        </td>
                      </tr>,
                      ...section.rows.map((row) => (
                        <tr key={row.permission}>
                          <td className="py-2 pr-3 text-text">{row.label}</td>
                          {Object.values(ROLE).map((value) => {
                            const allowed = row.roles.includes(value);
                            return (
                                  <td key={value} className="py-2 pr-3 text-text-muted">
                                    {allowed ?
                                          <span className={`inline-flex items-center gap-1.5 ${ROLE_STYLES[value] || ''} px-2 py-0.5 rounded border text-2xs uppercase tracking-wide`}>
                                            Allowed
                                          </span>
                                        :
                                          <span className="text-2xs text-text-muted/70 uppercase tracking-wide">
                                            —
                                          </span>}
                                  </td>
                                );
                          })}
                        </tr>
                      )),
                    ])}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}