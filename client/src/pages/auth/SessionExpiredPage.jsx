// =====================================================================
// SessionExpiredPage — re-authentication required screen.
// =====================================================================

import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';

export default function SessionExpiredPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="bg-bg-surface border border-bg-elevated rounded-lg p-8 text-center shadow-lg">
        <div className="mx-auto h-12 w-12 rounded-full bg-warning-soft text-warning-light flex items-center justify-center mb-4">
          <Icon name="clock" size="lg" />
        </div>
        <h1 className="text-lg font-semibold text-text mb-2">Session expired</h1>
        <p className="text-sm text-text-muted mb-6">
          Your session has timed out for security. Please sign in again to continue.
        </p>
        <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('/login', { state: { sessionExpired: true } })}>
          Sign in again
        </Button>
      </div>
    </AuthLayout>
  );
}
