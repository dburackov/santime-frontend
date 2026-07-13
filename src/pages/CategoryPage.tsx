import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import './CategoryPage.css';
import { useCategories } from '@/queries/useCategories';
import { useCategoryFilters } from '@/queries/useCategoryFilters';
import { useBrands } from '@/queries/useBrands';
import { useCatalogProducts } from '@/queries/useCatalogProducts';
import { useCatalogQueryState } from '@/hooks/useCatalogQueryState';
import { useViewMode } from '@/hooks/useViewMode';
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
import { FilterIcon } from '@/components/ui/icons';
import type { CatalogSort } from '@/api/types';

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'NAME_ASC', label: 'По названию А-Я' },
  { value: 'NAME_DESC', label: 'По названию Я-А' },
  { value: 'PRICE_ASC', label: 'Сначала дешевле' },
  { value: 'PRICE_DESC', label: 'Сначала дороже' },
];

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: categories } = useCategories();
  const category = useMemo(() => categories?.find((c) => c.slug === slug), [categories, slug]);

  const { data: filters } = useCategoryFilters(category?.id);
  const { data: brands } = useBrands(category?.id);
  const state = useCatalogQueryState(category?.id ?? 0, filters);
  const { viewMode, setViewMode } = useViewMode();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    data: page,
    isLoading,
    isError,
    refetch,
  } = useCatalogProducts(state.query, Boolean(category));

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
        <div className="category-page__grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
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
            onClose={() => setFiltersOpen(false)}
            resultCount={page?.totalElements}
          />
        )}

        <div className="category-page__content">
          <div className="category-page__toolbar">
            <button
              type="button"
              className="category-page__filters-btn"
              onClick={() => setFiltersOpen(true)}
            >
              <FilterIcon width={16} height={16} />
              Фильтры
              {state.hasActiveFilters && <span className="category-page__filters-dot" />}
            </button>

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
                    <ProductCard key={variant.variantId} variant={variant} displayAttributes={filters} />
                  ))}
                </div>
              ) : (
                <div className="category-page__list">
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
