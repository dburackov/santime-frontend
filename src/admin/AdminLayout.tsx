import { NavLink, Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminLayout.css';
import { ChevronLeftIcon } from '@/components/ui/icons';
import { useAuth } from '@/auth/useAuth';

const NAV_ITEMS = [
  { to: '/admin/categories', label: 'Категории' },
  { to: '/admin/brands', label: 'Бренды' },
  { to: '/admin/attributes', label: 'Атрибуты' },
  { to: '/admin/products', label: 'Товары' },
  { to: '/admin/orders', label: 'Заказы' },
  { to: '/admin/admins', label: 'Админы' },
];

export function AdminLayout() {
  const { isAuthenticated, isInitializing, mustChangePassword, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isInitializing) {
    return <div className="admin-shell admin-shell--loading">Загрузка…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (mustChangePassword && location.pathname !== '/admin/change-password') {
    return <Navigate to="/admin/change-password" replace />;
  }

  async function handleLogout() {
    await logout();
    navigate('/admin/login', { replace: true });
  }

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
          <NavLink
            to="/admin/change-password"
            className={({ isActive }) => `admin-header__nav-link ${isActive ? 'admin-header__nav-link--active' : ''}`}
          >
            Сменить пароль
          </NavLink>
          <button type="button" className="admin-header__nav-link admin-header__logout" onClick={handleLogout}>
            Выйти
          </button>
        </nav>
      </header>

      <main className="container admin-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
