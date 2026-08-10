'use client';

import { useState } from 'react';
import '@/views/CategoryPage.css';
import { useCatalogProducts } from '@/queries/useCatalogProducts';
import { useDiscountedBrands } from '@/queries/useDiscountedBrands';
import { useCatalogQueryState } from '@/hooks/useCatalogQueryState';
import { DISCOUNTS_PAGE_OPTIONS } from '@/queries/discountsQuery';
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
  { value: 'DISCOUNT_DESC', label: 'Сначала большая скидка' },
  { value: 'PRICE_ASC', label: 'Сначала дешевле' },
  { value: 'PRICE_DESC', label: 'Сначала дороже' },
  { value: 'NAME_ASC', label: 'По названию А-Я' },
];

export function DiscountsPage({ initialViewMode }: { initialViewMode: ViewMode }) {
  const { data: brands } = useDiscountedBrands();
  const state = useCatalogQueryState(undefined, [], DISCOUNTS_PAGE_OPTIONS);
  const { viewMode, setViewMode } = useViewMode(initialViewMode);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: page, isLoading, isError, refetch } = useCatalogProducts(state.query);

  return (
    <div className="container category-page">
      <Breadcrumbs items={[{ label: 'Каталог', to: '/catalog' }, { label: 'Скидки' }]} />

      <h1 className="category-page__title">Скидки</h1>

      <div className="category-page__layout">
        <FilterPanel
          filters={[]}
          brands={brands ?? []}
          state={state}
          open={filtersOpen}
          onOpen={() => setFiltersOpen(true)}
          onClose={() => setFiltersOpen(false)}
          resultCount={page?.totalElements}
        />

        <div className="category-page__content">
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
                <div className="category-page__grid">
                  {page.content.map((variant) => (
                    <ProductCard key={variant.variantId} variant={variant} />
                  ))}
                </div>
              ) : (
                <div className="category-page__list">
                  {page.content.map((variant) => (
                    <ProductListRow key={variant.variantId} variant={variant} />
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
