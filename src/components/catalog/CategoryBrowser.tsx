'use client';

import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import Link from 'next/link';
import './CategoryBrowser.css';
import '@/components/catalog/CategoryTile.css';
import { ArrowLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import type { CategoryResponse } from '@/api/types';

interface CategoryRowProps {
  category: CategoryResponse;
  hasChildren: boolean;
  onDrill: () => void;
}

function CategoryRow({ category, hasChildren, onDrill }: CategoryRowProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!hasChildren) return;
    event.preventDefault();
    onDrill();
  }

  return (
    <div className="category-browser__row">
      <Link
        href={`/category/${category.slug}`}
        className="home-category-tile home-category-tile--compact category-browser__parent"
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

/**
 * Мобильная раскладка каталога: список корневых категорий с погружением по уровням.
 * Выше 900px её скрывает CatalogPage.css и показывает сетку плиток.
 */
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

  // Экраны погружения — по одному на каждую категорию с детьми, любой глубины.
  const levels = useMemo(
    () => categories.filter((category) => childrenOf.has(category.id)),
    [categories, childrenOf],
  );

  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="category-browser">
      <div
        className={`category-browser__roots${
          openId !== null ? ' category-browser__roots--drilled' : ''
        }`}
      >
        {roots.map((root) => (
          <CategoryRow
            key={root.id}
            category={root}
            hasChildren={(childrenOf.get(root.id) ?? []).length > 0}
            onDrill={() => setOpenId(root.id)}
          />
        ))}
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
            <ArrowLeftIcon width={14} height={14} />
            Назад
          </button>

          {/* Заголовок уровня он же вход в саму категорию — отдельная плашка
              «Все товары категории» после этого не нужна. */}
          <Link href={`/category/${level.slug}`} className="category-browser__title">
            {level.name}
            <ChevronRightIcon width={18} height={18} />
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
