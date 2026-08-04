'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import { changePassword } from '@/api/auth';
import { useAuth } from '@/auth/useAuth';
import { fieldError, formError } from '@/admin/formErrors';
import { Button } from '@/components/ui/Button';

export function ChangePasswordPage() {
  const { mustChangePassword, markPasswordChanged } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mismatch, setMismatch] = useState(false);

  const mutation = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      markPasswordChanged();
      router.replace('/admin');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    mutation.mutate();
  }

  return (
    <div className="admin-page">
      <h1>Смена пароля</h1>

      {mustChangePassword && (
        <div className="admin-banner-error">Необходимо сменить временный пароль, прежде чем продолжить работу.</div>
      )}

      <form className="admin-form" onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
        {formError(mutation.error) && <div className="admin-banner-error">{formError(mutation.error)}</div>}

        <div className="admin-form-field">
          <label htmlFor="cp-current">Текущий пароль</label>
          <input
            id="cp-current"
            type="password"
            className="filter-text-input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {fieldError(mutation.error, 'currentPassword') && (
            <span className="admin-form-error">{fieldError(mutation.error, 'currentPassword')}</span>
          )}
        </div>

        <div className="admin-form-field">
          <label htmlFor="cp-new">Новый пароль (минимум 12 символов)</label>
          <input
            id="cp-new"
            type="password"
            className="filter-text-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={12}
            required
          />
          {fieldError(mutation.error, 'newPassword') && (
            <span className="admin-form-error">{fieldError(mutation.error, 'newPassword')}</span>
          )}
        </div>

        <div className="admin-form-field">
          <label htmlFor="cp-confirm">Повторите новый пароль</label>
          <input
            id="cp-confirm"
            type="password"
            className="filter-text-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          {mismatch && <span className="admin-form-error">Пароли не совпадают.</span>}
        </div>

        <Button type="submit" disabled={mutation.isPending}>
          Сохранить
        </Button>
      </form>
    </div>
  );
}
