'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import Link from 'next/link';
import './CategoryBrowser.css';
import '@/components/catalog/CategoryTile.css';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import type { CategoryResponse } from '@/api/types';

const MOBILE_QUERY = '(max-width: 899px)';

interface CategoryRowProps {
  category: CategoryResponse;
  hasChildren: boolean;
  onDrill: () => void;
  isActive?: boolean;
  onActivate?: () => void;
}

function CategoryRow({ category, hasChildren, onDrill, isActive, onActivate }: CategoryRowProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!hasChildren) return;
    // Ширина проверяется в момент клика, а не в рендере: разметка сервера и первого
    // клиентского рендера обязана совпадать, а useState-инициализатор с matchMedia
    // дал бы ровно тот рассинхрон гидрации, от которого правило и защищает.
    if (!window.matchMedia(MOBILE_QUERY).matches) return;
    event.preventDefault();
    onDrill();
  }

  return (
    <div className="category-browser__row" onMouseEnter={onActivate}>
      <Link
        href={`/category/${category.slug}`}
        className={`home-category-tile home-category-tile--compact category-browser__parent${
          isActive ? ' category-browser__parent--active' : ''
        }`}
        onFocus={onActivate}
        onClick={handleClick}
      >
        <span className="home-category-tile__text">
          <span className="home-category-tile__name">{category.name}</span>
        </span>
        <ChevronRightIcon className="home-category-tile__chevron" width={18} height={18} />
      </Link>
    </div>
  );
}

interface CategoryBrowserProps {
  categories: CategoryResponse[];
}

export function CategoryBrowser({ categories }: CategoryBrowserProps) {
  const { roots, childrenOf } = useMemo(() => {
    const byParent = new Map<number | null, CategoryResponse[]>();
    for (const category of categories) {
      const key = category.parentCategoryId ?? null;
      const siblings = byParent.get(key);
      if (siblings) siblings.push(category);
      else byParent.set(key, [category]);
    }
    return { roots: byParent.get(null) ?? [], childrenOf: byParent };
  }, [categories]);

  // Экраны погружения на мобильном — по одному на каждую категорию с детьми, любой
  // глубины. На десктопе они скрыты, но остаются в разметке и индексируются.
  const levels = useMemo(
    () => categories.filter((category) => childrenOf.has(category.id)),
    [categories, childrenOf],
  );

  const [activeId, setActiveId] = useState<number | null>(roots[0]?.id ?? null);
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div
      className="category-browser"
      /* Число корневых нужно самой сетке: правая панель раскрывается на все строки
         левой колонки через grid-row: 1 / -1, а для этого треки должны быть явными. */
      style={{ '--parent-count': roots.length } as CSSProperties}
    >
      <div
        className={`category-browser__roots${
          openId !== null ? ' category-browser__roots--drilled' : ''
        }`}
      >
        {roots.map((root) => {
          const children = childrenOf.get(root.id) ?? [];

          return (
            <div key={root.id} className="category-browser__item">
              <CategoryRow
                category={root}
                hasChildren={children.length > 0}
                isActive={root.id === activeId}
                onActivate={() => setActiveId(root.id)}
                onDrill={() => setOpenId(root.id)}
              />

              <div
                className={`category-browser__panel${
                  root.id === activeId ? ' category-browser__panel--active' : ''
                }`}
              >
                <Link href={`/category/${root.slug}`} className="category-browser__panel-title">
                  {root.name}
                </Link>

                {children.length > 0 && (
                  <div className="category-browser__groups">
                    {children.map((child) => {
                      const grandchildren = childrenOf.get(child.id) ?? [];

                      return (
                        <div key={child.id} className="category-browser__group">
                          <Link
                            href={`/category/${child.slug}`}
                            className="category-browser__group-title"
                          >
                            {child.name}
                          </Link>
                          {grandchildren.length > 0 && (
                            <ul className="category-browser__group-list">
                              {grandchildren.map((grandchild) => (
                                <li key={grandchild.id}>
                                  <Link
                                    href={`/category/${grandchild.slug}`}
                                    className="category-browser__group-link"
                                  >
                                    {grandchild.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {levels.map((level) => (
        <div
          key={level.id}
          className={`category-browser__level${
            level.id === openId ? ' category-browser__level--open' : ''
          }`}
        >
          <button
            type="button"
            className="category-browser__back"
            onClick={() => setOpenId(level.parentCategoryId ?? null)}
          >
            <ChevronLeftIcon width={18} height={18} />
            {level.name}
          </button>

          <Link href={`/category/${level.slug}`} className="category-browser__all">
            Все товары категории
            <ChevronRightIcon width={16} height={16} />
          </Link>

          {(childrenOf.get(level.id) ?? []).map((child) => (
            <CategoryRow
              key={child.id}
              category={child}
              hasChildren={childrenOf.has(child.id)}
              onDrill={() => setOpenId(child.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CategoryBrowserSkeleton() {
  return (
    <div className="category-browser category-browser--skeleton">
      <div className="category-browser__skeleton-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-block category-browser__skeleton-row" />
        ))}
      </div>
      <div className="skeleton-block category-browser__skeleton-panel" />
    </div>
  );
}
