import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Header.css';
import { ThemeToggle } from './ThemeToggle';
import { CartIcon, ChevronDownIcon, CloseIcon } from '@/components/ui/icons';
import { useCategories } from '@/queries/useCategories';
import { useCart } from '@/cart/useCart';

export function Header() {
  const { data: categories } = useCategories();
  const { totalCount } = useCart();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="header">
      <div className="container header__bar">
        <Link to="/" className="header__logo">
          Santime
        </Link>

        <button
          type="button"
          className="header__categories-toggle touch-target"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-expanded={mobileNavOpen}
        >
          Категории
          <ChevronDownIcon width={14} height={14} />
        </button>

        <nav className="header__nav" aria-label="Категории каталога">
          {categories?.map((category) => (
            <NavLink
              key={category.id}
              to={`/category/${category.slug}`}
              className={({ isActive }) => `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`}
            >
              {category.name}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          <ThemeToggle />
          <Link to="/cart" className="header__cart touch-target" aria-label="Корзина">
            <CartIcon width={20} height={20} />
            {totalCount > 0 && <span className="header__cart-count">{totalCount}</span>}
          </Link>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="header__mobile-nav">
          <div className="container header__mobile-nav-inner">
            <button
              type="button"
              className="header__mobile-nav-close touch-target"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Закрыть меню"
            >
              <CloseIcon width={18} height={18} />
            </button>
            <ul>
              {categories?.map((category) => (
                <li key={category.id}>
                  <NavLink to={`/category/${category.slug}`} onClick={() => setMobileNavOpen(false)}>
                    {category.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
