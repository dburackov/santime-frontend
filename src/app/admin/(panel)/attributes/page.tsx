import { Suspense } from 'react';
import { AttributesPage } from '@/admin/pages/AttributesPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="admin-shell admin-shell--loading">Загрузка…</div>}>
      <AttributesPage />
    </Suspense>
  );
}
