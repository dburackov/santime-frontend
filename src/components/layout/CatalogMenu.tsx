'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './CatalogMenu.css';
import { ChevronDownIcon } from '@/components/ui/icons';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { useCategories } from '@/queries/useCategories';
import { getRootCategories, getSubcategories } from '@/utils/categoryTree';
import { formatProductsCount } from '@/utils/plural';

/** Курсор проходит мимо пункта по дороге к панели — закрываем не мгновенно. */
const CLOSE_DELAY_MS = 120;

interface CatalogMenuProps {
  className: string;
}

export function CatalogMenu({ className }: CatalogMenuProps) {
  const { data: categories } = useCategories();
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Переход по ссылке из панели обязан её закрыть; сравнение в рендере — тот же приём,
  // что и в Header, эффект здесь только добавил бы лишний кадр.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }

  useEffect(() => cancelClose, []);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const roots = categories ? getRootCategories(categories) : [];

  return (
    <div
      className="catalog-menu"
      ref={rootRef}
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <Link
        href="/catalog"
        className={`${className} catalog-menu__trigger`}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(false)}
      >
        Каталог
        <ChevronDownIcon
          className={`catalog-menu__chevron${open ? ' catalog-menu__chevron--open' : ''}`}
          width={12}
          height={12}
        />
      </Link>

      {open && roots.length > 0 && (
        <div className="catalog-menu__panel">
          {roots.map((category) => (
            <div className="catalog-menu__item" key={category.id}>
              <Link
                href={`/category/${category.slug}`}
                className="catalog-menu__photo"
                tabIndex={-1}
                aria-hidden="true"
              >
                <ProductPhoto image={category.image} alt={category.name} size="menu" />
              </Link>

              <div className="catalog-menu__body">
                <Link href={`/category/${category.slug}`} className="catalog-menu__title">
                  <span className="catalog-menu__name">{category.name}</span>
                  <span className="catalog-menu__count">
                    {formatProductsCount(category.productCount)}
                  </span>
                </Link>

                <div className="catalog-menu__subs">
                  {getSubcategories(categories ?? [], category.id).map((sub) => (
                    <Link href={`/category/${sub.slug}`} className="catalog-menu__sub" key={sub.id}>
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
