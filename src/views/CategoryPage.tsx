'use client';

import { useMemo, useState } from 'react';
import { useRouteParams } from '@/hooks/useRouteParams';
import './CategoryPage.css';
import { useCategories } from '@/queries/useCategories';
import { useCategoryFilters } from '@/queries/useCategoryFilters';
import { useBrands } from '@/queries/useBrands';
import { useCatalogProducts } from '@/queries/useCatalogProducts';
import { useCatalogQueryState } from '@/hooks/useCatalogQueryState';
import { useViewMode } from '@/hooks/useViewMode';
import type { ViewMode } from '@/hooks/viewMode';
import { buildCategoryPath, getSubcategories } from '@/utils/categoryTree';
import { formatFoundProducts, formatProductsCount } from '@/utils/plural';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { FilterToggle } from '@/components/filters/FilterToggle';
import { SubcategoryChips } from '@/components/catalog/SubcategoryChips';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductListRow } from '@/components/product/ProductListRow';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { Pagination } from '@/components/ui/Pagination';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Select } from '@/components/ui/Select';
import type { CatalogSort } from '@/api/types';

const SORT_OPTIONS: { value: CatalogSort; label: string; summaryLabel: string }[] = [
  { value: 'POPULAR_DESC', label: 'Популярные', summaryLabel: 'Сначала популярные' },
  { value: 'PRICE_ASC', label: 'Дешевые', summaryLabel: 'Сначала дешевые' },
  { value: 'PRICE_DESC', label: 'Дорогие', summaryLabel: 'Сначала дорогие' },
  { value: 'NEW_DESC', label: 'Новые', summaryLabel: 'Сначала новые' },
  { value: 'DISCOUNT_DESC', label: 'Со скидкой', summaryLabel: 'Сначала со скидкой' },
];

/**
 * initialViewMode приходит с сервера (кука), а не подтягивается на клиенте:
 * сетка и список — это разные компоненты, и без готового значения первый
 * рендер рисовал бы сетку с последующим скачком. См. useViewMode.
 */
export function CategoryPage({ initialViewMode }: { initialViewMode: ViewMode }) {
  const { slug } = useRouteParams<{ slug: string }>();
  const { data: categories } = useCategories();
  const category = useMemo(() => categories?.find((c) => c.slug === slug), [categories, slug]);

  const ancestors = useMemo(
    () => (categories && category ? buildCategoryPath(categories, category.id).slice(0, -1) : []),
    [categories, category],
  );
  const subcategories = useMemo(
    () => (categories && category ? getSubcategories(categories, category.id) : []),
    [categories, category],
  );

  const { data: filters } = useCategoryFilters(category?.id);
  const { data: brands } = useBrands(category?.id);
  const state = useCatalogQueryState(category?.id ?? 0, filters);
  const { viewMode, setViewMode } = useViewMode(initialViewMode);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    data: page,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useCatalogProducts(state.query, Boolean(category));

  // Два независимых источника ожидания: RSC-навигация после смены URL и дозагрузка
  // списка react-query. Показанный список устарел, пока идёт любое из них.
  const isUpdating = state.isPending || (isFetching && !isLoading);

  if (categories && !category) {
    return (
      <div className="container" style={{ padding: 'var(--space-16) 0' }}>
        <ErrorState description="Категория не найдена." />
      </div>
    );
  }

  // Список категорий ещё не пришёл: без него нечего показывать, кроме пустой оболочки.
  if (!category) return null;

  return (
    <div className="container category-page">
      <Breadcrumbs
        items={[
          { label: 'Каталог', to: '/catalog' },
          ...ancestors.map((ancestor) => ({
            label: ancestor.name,
            to: `/category/${ancestor.slug}`,
          })),
        ]}
      />

      <div className="category-page__head">
        <div className="category-page__heading">
          <h1 className="category-page__title">{category.name}</h1>
          {page && (
            <span className="category-page__count category-page__count--inline">
              {formatProductsCount(page.totalElements)}
            </span>
          )}
        </div>
        {subcategories.length > 0 && <SubcategoryChips categories={subcategories} />}
      </div>

      <div className="category-page__layout">
        {filters && (
          <FilterPanel
            filters={filters}
            brands={brands ?? []}
            state={state}
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            resultCount={page?.totalElements}
          />
        )}

        <div className="category-page__content">
          <h2 className="visually-hidden">Товары</h2>

          <div className="category-page__toolbar">
            <span className="category-page__count">
              {page ? formatFoundProducts(page.totalElements) : ''}
            </span>

            <div className="category-page__toolbar-left">
              <ViewToggle value={viewMode} onChange={setViewMode} />
              <Select
                options={SORT_OPTIONS}
                value={state.sort}
                onChange={(value) => state.updateParams({ sort: value })}
                ariaLabel="Сортировка"
              />
              <FilterToggle
                hasActiveFilters={state.hasActiveFilters}
                onClick={() => setFiltersOpen(true)}
              />
            </div>
          </div>

          {isError && <ErrorState onRetry={refetch} />}

          {!isError && page && page.content.length === 0 && (
            <EmptyState
              description="По вашим фильтрам ничего не найдено."
              actionLabel="Сбросить фильтры"
              onAction={state.resetAllFilters}
            />
          )}

          {!isError && page && page.content.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <div className={`category-page__grid${isUpdating ? ' catalog-list--busy' : ''}`} aria-busy={isUpdating}>
                  {page.content.map((variant) => (
                    <ProductCard key={variant.variantId} variant={variant} />
                  ))}
                </div>
              ) : (
                <div className={`category-page__list${isUpdating ? ' catalog-list--busy' : ''}`} aria-busy={isUpdating}>
                  {page.content.map((variant) => (
                    <ProductListRow key={variant.variantId} variant={variant} displayAttributes={filters} />
                  ))}
                </div>
              )}

              <Pagination page={state.page} totalPages={page.totalPages} onChange={state.setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
