'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './AdminLayout.css';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { useAuth } from '@/auth/useAuth';

const NAV_ITEMS = [
  { to: '/admin/categories', label: 'Категории' },
  { to: '/admin/brands', label: 'Бренды' },
  { to: '/admin/attributes', label: 'Атрибуты' },
  { to: '/admin/products', label: 'Товары' },
  { to: '/admin/orders', label: 'Заказы' },
  { to: '/admin/promo-codes', label: 'Промокоды' },
  { to: '/admin/admins', label: 'Админы' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing, mustChangePassword, logout } = useAuth();
  const pathname = usePathname() ?? '';
  const router = useRouter();

  const needsLogin = !isInitializing && !isAuthenticated;
  const needsPasswordChange =
    !isInitializing && isAuthenticated && mustChangePassword && pathname !== '/admin/change-password';

  // Раньше это были <Navigate>, которые react-router умел рендерить прямо в
  // дереве. В Next перенаправление клиентского компонента — побочный эффект,
  // поэтому оно уходит в useEffect, а рендер ниже отдаёт заглушку, чтобы панель
  // не мелькнула до перехода.
  //
  // Проверка остаётся здесь, а не в middleware: access token живёт в памяти
  // вкладки (tokenStore), на сервере его нет и быть не должно.
  useEffect(() => {
    if (needsLogin) {
      // Куда вернуть после входа — раньше передавалось через state роутера,
      // которого в Next нет; кладём в query-параметр.
      router.replace(`/admin/login?from=${encodeURIComponent(pathname)}`);
    } else if (needsPasswordChange) {
      router.replace('/admin/change-password');
    }
  }, [needsLogin, needsPasswordChange, pathname, router]);

  if (isInitializing || needsLogin || needsPasswordChange) {
    return <div className="admin-shell admin-shell--loading">Загрузка…</div>;
  }

  async function handleLogout() {
    await logout();
    router.replace('/admin/login');
  }

  function navLinkClass(to: string) {
    // NavLink в react-router подсвечивался и на вложенных путях (без пропа end),
    // поэтому /admin/products/5/variants продолжает подсвечивать «Товары».
    const isActive = pathname === to || pathname.startsWith(`${to}/`);
    return `admin-header__nav-link ${isActive ? 'admin-header__nav-link--active' : ''}`;
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="container admin-header__bar">
          <Link href="/" className="admin-header__back touch-target">
            <ChevronLeftIcon width={16} height={16} />
            Витрина
          </Link>
          <span className="admin-header__title">Админ-панель</span>
        </div>
        <nav className="container admin-header__nav" aria-label="Разделы админ-панели">
          {NAV_ITEMS.map((item) => (
            <Link key={item.to} href={item.to} className={navLinkClass(item.to)}>
              {item.label}
            </Link>
          ))}
          <Link href="/admin/change-password" className={navLinkClass('/admin/change-password')}>
            Сменить пароль
          </Link>
          <button type="button" className="admin-header__nav-link admin-header__logout" onClick={handleLogout}>
            Выйти
          </button>
        </nav>
      </header>

      <main className="container admin-shell__main">{children}</main>
    </div>
  );
}
