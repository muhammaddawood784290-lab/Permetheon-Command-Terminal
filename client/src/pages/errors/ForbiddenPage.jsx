// =====================================================================
// ForbiddenPage — 403 screen when user lacks a permission.
// =====================================================================

import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import PageContainer from '../../layouts/PageContainer';

export default function ForbiddenPage({ requiredPermission }) {
  const navigate = useNavigate();

  return (
    <PageContainer
      title="Access denied"
      subtitle="You don't have permission to view this page."
    >
      <div className="bg-bg-surface border border-bg-elevated rounded-lg p-10 text-center max-w-xl mx-auto">
        <div className="mx-auto h-14 w-14 rounded-full bg-danger-soft text-danger-light flex items-center justify-center mb-4">
          <Icon name="lock" size="xl" />
        </div>
        <h2 className="text-lg font-semibold text-text mb-2">403 — Forbidden</h2>
        <p className="text-sm text-text-muted mb-2">
          Your current role does not include the permission required for this resource.
        </p>
        {requiredPermission && (
          <p className="text-xs text-text-muted/80 mb-6 font-mono">
            Required permission: <code>{requiredPermission}</code>
          </p>
        )}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Link to="/dashboard">
            <Button variant="primary">Dashboard</Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
