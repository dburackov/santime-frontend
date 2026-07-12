import { NavLink, Outlet, Link } from 'react-router-dom';
import './AdminLayout.css';
import { ChevronLeftIcon } from '@/components/ui/icons';

const NAV_ITEMS = [
  { to: '/admin/categories', label: 'Категории' },
  { to: '/admin/brands', label: 'Бренды' },
  { to: '/admin/attributes', label: 'Атрибуты' },
  { to: '/admin/products', label: 'Товары' },
  { to: '/admin/orders', label: 'Заказы' },
];

export function AdminLayout() {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="container admin-header__bar">
          <Link to="/" className="admin-header__back touch-target">
            <ChevronLeftIcon width={16} height={16} />
            Витрина
          </Link>
          <span className="admin-header__title">Админ-панель</span>
        </div>
        <nav className="container admin-header__nav" aria-label="Разделы админ-панели">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `admin-header__nav-link ${isActive ? 'admin-header__nav-link--active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="container admin-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
