import type { CatalogFilterAttributeResponse, CatalogProductsQuery, CatalogSort } from '@/api/types';

export const PAGE_SIZE = 20;

/** Минимум, который нужен для чтения — ReadonlyURLSearchParams из Next сюда тоже подходит. */
export type ReadableParams = Pick<URLSearchParams, 'get'>;

/**
 * Разбор состояния каталога из query-string.
 *
 * Модуль намеренно БЕЗ 'use client': его вызывает и серверный компонент
 * category/[slug]/page.tsx, чтобы построить РОВНО ТОТ ЖЕ объект запроса, что
 * потом соберёт клиентский хук. Ключ react-query включает этот объект целиком,
 * и если сервер соберёт его хоть немного иначе, префетч не совпадёт — в HTML
 * уедет скелетон вместо товаров, то есть ровно та проблема, ради которой
 * затевался переезд на SSR.
 *
 * Имена и формат параметров менять нельзя: их напрямую разбирает бэкенд
 * (CatalogProductService.RESERVED_PARAMS плюс произвольные слаги атрибутов),
 * и на них же завязаны уже разосланные ссылки.
 */
export function buildCatalogQuery(
  categoryId: number,
  searchParams: ReadableParams,
  filters: CatalogFilterAttributeResponse[] | undefined,
): CatalogProductsQuery {
  const parsed = parseCatalogParams(searchParams, filters);
  return {
    categoryId,
    brandIds: parsed.brandIds,
    priceMin: parsed.priceMin,
    priceMax: parsed.priceMax,
    inStock: parsed.inStock || undefined,
    sort: parsed.sort,
    page: parsed.page,
    size: PAGE_SIZE,
    attributeFilters: parsed.attributeFilters,
    attributeRangeFilters: parsed.attributeRangeFilters,
  };
}

export function parseCatalogParams(
  searchParams: ReadableParams,
  filters: CatalogFilterAttributeResponse[] | undefined,
) {
  const sort = (searchParams.get('sort') as CatalogSort) || 'NAME_ASC';
  const pageParam = Number(searchParams.get('page') ?? '1');
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam - 1 : 0;
  const priceMinRaw = searchParams.get('priceMin');
  const priceMaxRaw = searchParams.get('priceMax');
  const priceMin = priceMinRaw ? Number(priceMinRaw) : undefined;
  const priceMax = priceMaxRaw ? Number(priceMaxRaw) : undefined;
  const inStockRaw = searchParams.get('inStock');
  const inStock = inStockRaw === null ? true : inStockRaw === 'true';
  const brandIdsRaw = searchParams.get('brandIds');
  const brandIds = brandIdsRaw ? brandIdsRaw.split(',').map(Number).filter((n) => !Number.isNaN(n)) : [];

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

  return { sort, page, priceMin, priceMax, inStock, inStockRaw, brandIds, attributeFilters, attributeRangeFilters };
}
