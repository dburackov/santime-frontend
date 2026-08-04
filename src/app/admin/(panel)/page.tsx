import { redirect } from 'next/navigation';

// Замена <Route index element={<Navigate to="categories" replace />} />.
// Здесь редирект серверный: он не зависит от состояния авторизации, поэтому
// его не нужно откладывать до гидрации, как в AdminLayout.
export default function AdminIndexPage() {
  redirect('/admin/categories');
}
