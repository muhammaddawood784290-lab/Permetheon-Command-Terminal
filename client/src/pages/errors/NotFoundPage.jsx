// =====================================================================
// NotFoundPage — 404 for unknown routes.
// =====================================================================

import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import PageContainer from '../../layouts/PageContainer';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <div className="bg-bg-surface border border-bg-elevated rounded-lg p-10 text-center max-w-xl mx-auto mt-12">
        <div className="text-6xl font-bold text-primary-500 mb-2">404</div>
        <h2 className="text-lg font-semibold text-text mb-2">Page not found</h2>
        <p className="text-sm text-text-muted mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Link to="/dashboard">
            <Button variant="primary" leftIcon={<Icon name="dashboard" size="sm" />}>
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
