'use client';

import { useState } from 'react';
import '@/views/CategoryPage.css';
import { useCatalogProducts } from '@/queries/useCatalogProducts';
import { useSearchFacets } from '@/queries/useSearchFacets';
import { useCatalogQueryState } from '@/hooks/useCatalogQueryState';
import { isUsableSearchTerm } from '@/hooks/catalogQuery';
import { SEARCH_PAGE_OPTIONS } from '@/queries/searchQuery';
import { useViewMode } from '@/hooks/useViewMode';
import type { ViewMode } from '@/hooks/viewMode';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { FilterToggle } from '@/components/filters/FilterToggle';
import { formatFoundProducts, formatProductsCount } from '@/utils/plural';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductListRow } from '@/components/product/ProductListRow';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { Pagination } from '@/components/ui/Pagination';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Select } from '@/components/ui/Select';
import type { CatalogSort } from '@/api/types';

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'POPULAR_DESC', label: 'Сначала популярные' },
  { value: 'PRICE_ASC', label: 'Сначала дешевле' },
  { value: 'PRICE_DESC', label: 'Сначала дороже' },
  { value: 'NEW_DESC', label: 'Сначала новинки' },
  { value: 'DISCOUNT_DESC', label: 'Сначала большая скидка' },
];

export function SearchPage({ initialViewMode }: { initialViewMode: ViewMode }) {
  const state = useCatalogQueryState(undefined, [], SEARCH_PAGE_OPTIONS);
  const term = state.term;
  const usable = isUsableSearchTerm(term);

  const { data: facets } = useSearchFacets(term);
  const { viewMode, setViewMode } = useViewMode(initialViewMode);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: page, isLoading, isFetching, isError, refetch } = useCatalogProducts(state.query, usable);

  // Два независимых источника ожидания: RSC-навигация после смены URL и дозагрузка
  // списка react-query. Показанный список устарел, пока идёт любое из них.
  const isUpdating = state.isPending || (isFetching && !isLoading);

  const heading = (
    <div className="category-page__head">
      <div className="category-page__heading">
        <h1 className="category-page__title">{term ? `Поиск «${term}»` : 'Поиск'}</h1>
        {usable && page && (
          <span className="category-page__count category-page__count--inline">
            {formatProductsCount(page.totalElements)}
          </span>
        )}
      </div>
    </div>
  );

  // Короткий запрос не ходит ни за товарами, ни за фасетами: фильтровать и сортировать
  // нечего, поэтому ни тулбара, ни шторки здесь нет.
  if (!usable) {
    return (
      <div className="container category-page">
        <Breadcrumbs items={[{ label: 'Каталог', to: '/catalog' }, { label: 'Поиск' }]} />
        {heading}
        <EmptyState
          title="Уточните запрос"
          description="Введите минимум 2 символа — название товара или артикул."
        />
      </div>
    );
  }

  return (
    <div className="container category-page">
      <Breadcrumbs items={[{ label: 'Каталог', to: '/catalog' }, { label: 'Поиск' }]} />

      {heading}

      <div className="category-page__layout">
        <FilterPanel
          filters={[]}
          brands={facets?.brands ?? []}
          categories={facets?.categories ?? []}
          state={state}
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          resultCount={page?.totalElements}
        />

        <div className="category-page__content">
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
              description={`По запросу «${term}» ничего не найдено.`}
              {...(state.hasActiveFilters
                ? { actionLabel: 'Сбросить фильтры', onAction: state.resetAllFilters }
                : {})}
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
