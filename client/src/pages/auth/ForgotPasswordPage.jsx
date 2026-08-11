// =====================================================================
// ForgotPasswordPage — request password reset (UI only for Phase 1).
// =====================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <AuthLayout subtitle="Reset your password">
      <div className="bg-bg-surface border border-bg-elevated rounded-lg p-6 shadow-lg">
        {submitted ? (
          <Alert
            type="success"
            title="Check your inbox"
            className="mb-4"
          >
            If an account exists for <strong>{email}</strong>, a reset link has been sent.
          </Alert>
        ) : (
          <p className="text-sm text-text-muted mb-4">
            Enter your email and we'll send a password reset link.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@permetheon.com"
            required
            disabled={submitted}
          />
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitted}>
            {submitted ? 'Sent' : 'Send reset link'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-primary-400 hover:text-primary-300">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
