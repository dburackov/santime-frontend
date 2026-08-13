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
import { FilterPanel } from '@/components/filters/FilterPanel';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductListRow } from '@/components/product/ProductListRow';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { Pagination } from '@/components/ui/Pagination';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SkeletonCard, SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Select } from '@/components/ui/Select';
import type { CatalogSort } from '@/api/types';

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'NAME_ASC', label: 'По названию А-Я' },
  { value: 'NAME_DESC', label: 'По названию Я-А' },
  { value: 'PRICE_ASC', label: 'Сначала дешевле' },
  { value: 'PRICE_DESC', label: 'Сначала дороже' },
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

  if (!category) {
    return (
      <div className="container category-page">
        <div className={viewMode === 'grid' ? 'category-page__grid' : 'category-page__list'}>
          {Array.from({ length: viewMode === 'grid' ? 8 : 6 }).map((_, i) =>
            viewMode === 'grid' ? <SkeletonCard key={i} /> : <SkeletonRow key={i} />,
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container category-page">
      <Breadcrumbs items={[{ label: 'Каталог', to: '/catalog' }, { label: category?.name ?? '…' }]} />

      <h1 className="category-page__title">{category?.name}</h1>

      <div className="category-page__layout">
        {filters && (
          <FilterPanel
            filters={filters}
            brands={brands ?? []}
            state={state}
            open={filtersOpen}
            onOpen={() => setFiltersOpen(true)}
            onClose={() => setFiltersOpen(false)}
            resultCount={page?.totalElements}
          />
        )}

        <div className="category-page__content">
          <h2 className="visually-hidden">Товары</h2>

          <div className="category-page__toolbar">
            <span className="category-page__count">
              {page ? `Найдено ${page.totalElements} товаров` : ''}
            </span>

            <div className="category-page__toolbar-right">
              <Select
                options={SORT_OPTIONS}
                value={state.sort}
                onChange={(value) => state.updateParams({ sort: value })}
                ariaLabel="Сортировка"
              />
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>

          {isError && <ErrorState onRetry={refetch} />}

          {isLoading && !page && (
            <div className={viewMode === 'grid' ? 'category-page__grid' : 'category-page__list'}>
              {Array.from({ length: viewMode === 'grid' ? 8 : 6 }).map((_, i) =>
                viewMode === 'grid' ? <SkeletonCard key={i} /> : <SkeletonRow key={i} />,
              )}
            </div>
          )}

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
                    <ProductCard key={variant.variantId} variant={variant} displayAttributes={filters} />
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
