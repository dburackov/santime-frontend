import { Suspense } from 'react';
import { OrdersPage } from '@/admin/pages/OrdersPage';

/**
 * Suspense обязателен: OrdersPage держит статус и страницу в query-параметрах и читает их
 * через useSearchParams — request-time API, без границы Next не отрендерит страницу.
 */
export default function Page() {
  return (
    <Suspense fallback={<div className="admin-shell admin-shell--loading">Загрузка…</div>}>
      <OrdersPage />
    </Suspense>
  );
}
