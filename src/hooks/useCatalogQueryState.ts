import { useSearchParams } from 'react-router-dom';
import type { CatalogFilterAttributeResponse, CatalogProductsQuery, CatalogSort } from '@/api/types';

const PAGE_SIZE = 20;

/**
 * Кодирует состояние фильтров/сортировки/страницы категории в query-string URL,
 * чтобы список товаров переживал refresh и был доступен по ссылке (api.md п.1.2, ТЗ п.3.2.4).
 */
export function useCatalogQueryState(categoryId: number, filters: CatalogFilterAttributeResponse[] | undefined) {
  const [searchParams, setSearchParams] = useSearchParams();

  const sort = (searchParams.get('sort') as CatalogSort) || 'NAME_ASC';
  const pageParam = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam - 1 : 0;
  const priceMinRaw = searchParams.get('priceMin');
  const priceMaxRaw = searchParams.get('priceMax');
  const priceMin = priceMinRaw ? Number(priceMinRaw) : undefined;
  const priceMax = priceMaxRaw ? Number(priceMaxRaw) : undefined;
  const inStockRaw = searchParams.get('inStock');
  const inStock = inStockRaw === null ? true : inStockRaw === 'true';
  const brandIdRaw = searchParams.get('brandId');
  const brandId = brandIdRaw ? Number(brandIdRaw) : undefined;

  const attributeFilters: Record<string, string> = {};
  const attributeRangeFilters: Record<string, { min?: number; max?: number }> = {};

  for (const attribute of filters ?? []) {
    if (attribute.type === 'NUMBER') {
      const min = searchParams.get(`${attribute.slug}_min`);
      const max = searchParams.get(`${attribute.slug}_max`);
      if (min !== null || max !== null) {
        attributeRangeFilters[attribute.slug] = {
          min: min !== null ? Number(min) : undefined,
          max: max !== null ? Number(max) : undefined,
        };
      }
    } else {
      const value = searchParams.get(attribute.slug);
      if (value) attributeFilters[attribute.slug] = value;
    }
  }

  const query: CatalogProductsQuery = {
    categoryId,
    brandId,
    priceMin,
    priceMax,
    inStock: inStock || undefined,
    sort,
    page,
    size: PAGE_SIZE,
    attributeFilters,
    attributeRangeFilters,
  };

  function updateParams(patch: Record<string, string | undefined>, options: { resetPage?: boolean } = {}) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    }
    if (options.resetPage !== false) next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function resetAllFilters() {
    const next = new URLSearchParams();
    setSearchParams(next, { replace: true });
  }

  function setPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 0) next.delete('page');
    else next.set('page', String(nextPage + 1));
    setSearchParams(next, { replace: true });
  }

  const hasActiveFilters =
    Object.keys(attributeFilters).length > 0 ||
    Object.keys(attributeRangeFilters).length > 0 ||
    priceMin !== undefined ||
    priceMax !== undefined ||
    inStockRaw === 'false' ||
    brandId !== undefined;

  return {
    query,
    sort,
    page,
    priceMin,
    priceMax,
    inStock,
    brandId,
    attributeFilters,
    attributeRangeFilters,
    searchParams,
    updateParams,
    resetAllFilters,
    setPage,
    hasActiveFilters,
  };
}

export type CatalogQueryState = ReturnType<typeof useCatalogQueryState>;
