'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import '@/admin/admin.css';
import '@/components/filters/Filters.css';
import { createAdmin } from '@/api/auth';
import { fieldError, formError } from '@/admin/formErrors';
import { Button } from '@/components/ui/Button';

export function AdminsPage() {
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: () => createAdmin({ email }),
    onSuccess: () => setEmail(''),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="admin-page">
      <h1>Администраторы</h1>
      <p style={{ color: 'var(--color-slate)', marginBottom: 'var(--space-4)' }}>
        Создание нового администратора. Временный пароль показывается один раз в ответе — передайте его новому
        администратору напрямую, при первом входе он должен будет сменить пароль.
      </p>

      <form className="admin-form" onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
        {formError(mutation.error) && <div className="admin-banner-error">{formError(mutation.error)}</div>}

        <div className="admin-form-field">
          <label htmlFor="new-admin-email">Email</label>
          <input
            id="new-admin-email"
            type="email"
            className="filter-text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {fieldError(mutation.error, 'email') && (
            <span className="admin-form-error">{fieldError(mutation.error, 'email')}</span>
          )}
        </div>

        <Button type="submit" disabled={mutation.isPending}>
          Создать
        </Button>
      </form>

      {mutation.isSuccess && mutation.data && (
        <div className="admin-banner-success" style={{ marginTop: 'var(--space-4)', maxWidth: 360 }}>
          <p>
            Админ <strong>{mutation.data.email}</strong> создан. Временный пароль (показывается только сейчас,
            повторно получить его нельзя):
          </p>
          <p className="mono-num" style={{ fontWeight: 600, marginTop: 'var(--space-2)' }}>
            {mutation.data.temporaryPassword}
          </p>
        </div>
      )}
    </div>
  );
}
