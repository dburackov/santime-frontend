import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Вход в админ-панель',
  robots: { index: false, follow: false },
};

// Страница входа намеренно вне группы (panel): AdminLayout требует авторизации
// и увёл бы на /admin/login сам себя.
export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
