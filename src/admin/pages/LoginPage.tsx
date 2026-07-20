import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import '@/admin/admin.css';
import './AuthPages.css';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/api/client';

export function LoginPage() {
  const { isAuthenticated, isInitializing, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isInitializing && isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/admin';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="admin-form auth-page__card" onSubmit={handleSubmit}>
        <h1 className="auth-page__title">Вход в админ-панель</h1>

        {error && <div className="admin-banner-error">{error}</div>}

        <div className="admin-form-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className="filter-text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </div>

        <div className="admin-form-field">
          <label htmlFor="login-password">Пароль</label>
          <input
            id="login-password"
            type="password"
            className="filter-text-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          Войти
        </Button>
      </form>
    </div>
  );
}
