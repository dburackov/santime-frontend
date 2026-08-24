'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { buildCatalogQuery, parseCatalogParams, type CatalogQueryOptions } from './catalogQuery';
import { scrollToTop } from '@/utils/scrollToTop';
import type { CatalogFilterAttributeResponse } from '@/api/types';

/**
 * Кодирует состояние фильтров/сортировки/страницы категории в query-string URL,
 * чтобы список товаров переживал refresh и был доступен по ссылке (api.md п.1.2, ТЗ п.3.2.4).
 *
 * Имена и формат параметров менять нельзя: их напрямую разбирает бэкенд
 * (CatalogProductService.RESERVED_PARAMS плюс произвольные слаги атрибутов),
 * и на них же завязаны уже разосланные ссылки.
 */
export function useCatalogQueryState(
  categoryId: number | undefined,
  filters: CatalogFilterAttributeResponse[] | undefined,
  options: CatalogQueryOptions = {},
) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const [isPending, startTransition] = useTransition();

  /**
   * В Next useSearchParams только на чтение, поэтому запись идёт через роутер.
   * scroll: false сохраняет позицию списка при смене фильтра — раньше это
   * обеспечивал setSearchParams(..., { replace: true }) в react-router.
   *
   * startTransition даёт isPending на время RSC-навигации. Без него смена фильтра
   * никак не видна: keepPreviousData в useCatalogProducts держит прежний список,
   * и на медленной сети страница выглядит зависшей.
   */
  function commit(next: URLSearchParams) {
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  const { sort, page, priceMin, priceMax, inStock, inStockRaw, brandIds, attributeFilters, attributeRangeFilters } =
    parseCatalogParams(searchParams, filters, options.defaultSort);

  const query = buildCatalogQuery(categoryId, searchParams, filters, options);

  function updateParams(patch: Record<string, string | undefined>, options: { resetPage?: boolean } = {}) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    }
    if (options.resetPage !== false) next.delete('page');
    commit(next);
  }

  function resetAllFilters() {
    commit(new URLSearchParams());
  }

  function setPage(nextPage: number) {
    const next = new URLSearchParams(searchParams.toString());
    if (nextPage <= 0) next.delete('page');
    else next.set('page', String(nextPage + 1));
    commit(next);
    // Смена фильтра позицию сохраняет (scroll: false выше), а смена страницы — нет:
    // иначе новая страница открывается с середины списка.
    scrollToTop();
  }

  const hasActiveFilters =
    Object.keys(attributeFilters).length > 0 ||
    Object.keys(attributeRangeFilters).length > 0 ||
    priceMin !== undefined ||
    priceMax !== undefined ||
    inStockRaw === 'false' ||
    brandIds.length > 0;

  return {
    query,
    sort,
    page,
    priceMin,
    priceMax,
    inStock,
    brandIds,
    attributeFilters,
    attributeRangeFilters,
    searchParams,
    updateParams,
    resetAllFilters,
    setPage,
    hasActiveFilters,
    isPending,
  };
}

export type CatalogQueryState = ReturnType<typeof useCatalogQueryState>;
