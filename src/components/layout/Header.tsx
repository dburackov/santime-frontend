'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Header.css';
import { ThemeToggle } from './ThemeToggle';
import { SearchBox } from './SearchBox';
import { CartIcon, CloseIcon, MenuIcon, SearchIcon } from '@/components/ui/icons';
import { useCart } from '@/cart/useCart';
import { NAV_LINKS, SITE_PHONES } from '@/config/siteInfo';

export function Header() {
  const { totalCount } = useCart();
  const pathname = usePathname() ?? '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }

  function isNavLinkActive(to: string) {
    if (to === '/') return pathname === '/';
    if (to === '/catalog') return pathname === '/catalog' || pathname.startsWith('/category/');
    return pathname === to;
  }

  return (
    <header className="header">
      <div className="header__util-bar">
        <div className="container header__util-bar-inner">
          <div className="header__phones">
            {SITE_PHONES.map((phone, i) => (
              <span key={phone.href} className="header__phone-item">
                {i > 0 && <span className="header__phone-dot" aria-hidden="true">·</span>}
                <a href={phone.href}>{phone.display}</a>
              </span>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="header__main-bar">
        <div className="container header__main-bar-inner">
          {mobileSearchOpen ? (
            <div className="header__mobile-search">
              <SearchBox
                autoFocus
                onNavigate={() => setMobileSearchOpen(false)}
                onClose={() => setMobileSearchOpen(false)}
              />
            </div>
          ) : (
            <>
              <button
                type="button"
                className="header__burger touch-target"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Открыть меню"
                aria-expanded={mobileMenuOpen}
              >
                <MenuIcon width={20} height={20} />
              </button>

              <Link href="/" className="header__logo">
                santime
              </Link>

              <nav className="header__nav" aria-label="Основная навигация">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    href={link.to}
                    className={`header__nav-link ${isNavLinkActive(link.to) ? 'header__nav-link--active' : ''}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="header__search-slot">
                <SearchBox inputId="header-search-desktop" />
              </div>

              <div className="header__actions">
                <button
                  type="button"
                  className="header__search-toggle touch-target"
                  onClick={() => setMobileSearchOpen(true)}
                  aria-label="Открыть поиск"
                >
                  <SearchIcon width={20} height={20} />
                </button>

                <Link href="/cart" className="header__cart touch-target" aria-label="Корзина">
                  <CartIcon width={18} height={18} />
                  {totalCount > 0 && <span className="header__cart-count">{totalCount}</span>}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="header__drawer">
          <div className="header__drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
          <div className="header__drawer-panel" role="dialog" aria-modal="true" aria-label="Меню">
            <button
              type="button"
              className="header__drawer-close touch-target"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Закрыть меню"
            >
              <CloseIcon width={18} height={18} />
            </button>

            <nav className="header__drawer-nav" aria-label="Основная навигация">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  href={link.to}
                  className={isNavLinkActive(link.to) ? 'header__drawer-nav-link--active' : ''}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="header__drawer-section">
              {SITE_PHONES.map((phone) => (
                <a key={phone.href} href={phone.href}>
                  {phone.display}
                </a>
              ))}
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
