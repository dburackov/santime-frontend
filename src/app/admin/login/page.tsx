import { Suspense } from 'react';
import { LoginPage } from '@/admin/pages/LoginPage';

/**
 * Suspense обязателен: LoginPage читает ?from= через useSearchParams, а это
 * request-time API — без границы Next не может отрендерить страницу статически.
 * Здесь это безвредно, в отличие от страниц витрины: логин под noindex и
 * краулеру показывать нечего.
 */
export default function Page() {
  return (
    <Suspense fallback={<div className="admin-shell admin-shell--loading">Загрузка…</div>}>
      <LoginPage />
    </Suspense>
  );
}
