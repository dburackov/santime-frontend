import { Suspense } from 'react';
import { ProductsPage } from '@/admin/pages/ProductsPage';

/**
 * Suspense обязателен: ProductsPage держит фильтры в query-параметрах и читает их
 * через useSearchParams — request-time API, без границы Next не отрендерит страницу.
 */
export default function Page() {
  return (
    <Suspense fallback={<div className="admin-shell admin-shell--loading">Загрузка…</div>}>
      <ProductsPage />
    </Suspense>
  );
}
