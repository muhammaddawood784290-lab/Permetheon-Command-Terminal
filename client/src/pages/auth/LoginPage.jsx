// =====================================================================
// LoginPage — credentials + role-demo quick login.
// =====================================================================

import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Checkbox from '../../components/ui/Checkbox';
import Alert from '../../components/ui/Alert';
import Icon from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLE, ROLE_LABELS } from '../../utils/constants';
import { mockUsers } from '../../mock/mockData';

const QUICK_LOGIN = [
  { role: ROLE.ADMIN, email: 'admin@permetheon.com' },
  { role: ROLE.TEAM_LEAD, email: 'linda@permetheon.com' },
  { role: ROLE.DEVELOPER, email: 'david@permetheon.com' },
];

export default function LoginPage() {
  const { login, isAuthenticated, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { push } = useToast();

  const [email, setEmail] = useState('admin@permetheon.com');
  const [password, setPassword] = useState('pctadmin');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, send to dashboard.
  useEffect(() => {
    if (isAuthenticated) {
      const dest = location.state?.from?.pathname || '/dashboard';
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password, remember });
      push({ type: 'success', message: `Welcome back, ${res.user.name}.` });
      const dest = location.state?.from?.pathname || '/dashboard';
      navigate(dest, { replace: true });
    } catch {
      // Error surfaced via context.
    }
  };

  const quickLogin = async (userEmail) => {
    setEmail(userEmail);
    setPassword('password');
    try {
      const res = await login({ email: userEmail, password: 'password', remember: true });
      push({ type: 'success', message: `Signed in as ${res.user.name}.` });
      navigate('/dashboard', { replace: true });
    } catch {
      /* surface via context */
    }
  };

  const sessionExpired = location.state?.sessionExpired;

  return (
    <AuthLayout subtitle="Sign in to your workspace">
      {sessionExpired && (
        <div className="mb-4">
          <Alert type="warning" title="Session expired">
            Please sign in again to continue.
          </Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert type="danger" title="Sign-in failed">
            {error}
          </Alert>
        </div>
      )}

      <div className="bg-bg-surface border border-bg-elevated rounded-lg p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@permetheon.com"
            required
            autoComplete="email"
            leftIcon={<Icon name="message" size="sm" />}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              leftIcon={<Icon name="lock" size="sm" />}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs text-text-muted hover:text-text-secondary mt-1"
            >
              {showPassword ? 'Hide' : 'Show'} password
            </button>
          </div>

          <div className="flex items-center justify-between">
            <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>
              Remember me
            </Checkbox>
            <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-bg-elevated">
          <div className="text-xs uppercase tracking-wider text-text-muted mb-3">
            Quick demo logins
          </div>
          <div className="grid grid-cols-1 gap-2">
            {QUICK_LOGIN.map((item) => (
              <button
                key={item.email}
                type="button"
                onClick={() => quickLogin(item.email)}
                className="flex items-center justify-between px-3 py-2 rounded-md bg-bg-elevated/40 hover:bg-bg-elevated text-left transition-colors"
              >
                <div>
                  <div className="text-sm text-text">{ROLE_LABELS[item.role]}</div>
                  <div className="text-xs text-text-muted">{item.email}</div>
                </div>
                <Icon name="chevronRight" size="sm" className="text-text-muted" />
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-text-muted/80">
            Demo environment · {mockUsers.length} mock users available
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
