import type { CatalogFilterAttributeResponse, CatalogProductsQuery, CatalogSort } from '@/api/types';

export const PAGE_SIZE = 24;

/** Размер витринного блока подборки. То же значение, что STOREFRONT_BLOCK_SIZE в CatalogController. */
export const STOREFRONT_BLOCK_SIZE = 8;

/** Минимум, который нужен для чтения — ReadonlyURLSearchParams из Next сюда тоже подходит. */
export type ReadableParams = Pick<URLSearchParams, 'get'>;

/** Дефолт и набор пунктов страницы категории. Читают и серверный префетч, и клиентский хук —
 * разъедутся значения, разъедутся и ключи react-query, и страница мигнёт после гидрации. */
export const CATEGORY_DEFAULT_SORT: CatalogSort = 'POPULAR_DESC';

export const CATEGORY_SORT_VALUES: CatalogSort[] = [
  'POPULAR_DESC',
  'PRICE_ASC',
  'PRICE_DESC',
  'NEW_DESC',
  'DISCOUNT_DESC',
];

/** Имя параметра строки поиска в публичном URL. На бэкенд уходит как name. */
export const SEARCH_TERM_PARAM = 'q';

export const SEARCH_MIN_TERM_LENGTH = 2;

/** Один нормализатор на сервер, клиент и выпадашку: иначе ключи react-query разъедутся. */
export function normalizeSearchTerm(raw: string | null | undefined): string {
  return (raw ?? '').trim().replace(/\s+/g, ' ');
}

export function isUsableSearchTerm(term: string): boolean {
  return term.length >= SEARCH_MIN_TERM_LENGTH;
}

export interface CatalogQueryOptions {
  discounted?: boolean;
  defaultSort?: CatalogSort;
  /** Значения sort, которые страница показывает в селекторе. Проверять надо именно по ним,
   * а не по всему CatalogSort: DISCOUNT_DESC валиден на обеих страницах, а POPULAR_DESC — только
   * в категории, и ссылка на чужой пункт оставила бы кнопку селектора пустой. */
  allowedSorts?: CatalogSort[];
  /** Читать ?q= и отправлять его как name. Включает только страница поиска: `q` не входит
   * в RESERVED_PARAMS бэкенда и остаётся легальным слагом атрибута (SlugRules.PATTERN
   * допускает слаг из одной буквы), поэтому безусловное чтение дало бы ему двойной смысл. */
  readSearchTerm?: boolean;
}

export function buildCatalogQuery(
  categoryId: number | undefined,
  searchParams: ReadableParams,
  filters: CatalogFilterAttributeResponse[] | undefined,
  options: CatalogQueryOptions = {},
): CatalogProductsQuery {
  const parsed = parseCatalogParams(searchParams, filters, options);
  return {
    categoryId,
    // Скалярный categoryId и список взаимоисключающи: случайный ?categoryIds= на странице
    // категории не должен сбивать её атрибутные фильтры, которые завязаны на categoryId.
    ...(categoryId === undefined && parsed.categoryIds.length > 0
      ? { categoryIds: parsed.categoryIds }
      : {}),
    ...(isUsableSearchTerm(parsed.term) ? { name: parsed.term } : {}),
    brandIds: parsed.brandIds,
    priceMin: parsed.priceMin,
    priceMax: parsed.priceMax,
    inStock: parsed.inStock || undefined,
    ...(options.discounted ? { discounted: true } : {}),
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
  options: CatalogQueryOptions = {},
) {
  const defaultSort = options.defaultSort ?? CATEGORY_DEFAULT_SORT;
  const allowedSorts = options.allowedSorts ?? CATEGORY_SORT_VALUES;
  // Чужой sort раньше уходил на бэк как есть (400) и оставлял кнопку селектора пустой.
  const sortRaw = searchParams.get('sort') as CatalogSort | null;
  const sort = sortRaw && allowedSorts.includes(sortRaw) ? sortRaw : defaultSort;
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
  const categoryIdsRaw = searchParams.get('categoryIds');
  const categoryIds = categoryIdsRaw
    ? categoryIdsRaw.split(',').map(Number).filter((n) => !Number.isNaN(n))
    : [];
  const term = options.readSearchTerm ? normalizeSearchTerm(searchParams.get(SEARCH_TERM_PARAM)) : '';

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

  return {
    sort,
    page,
    priceMin,
    priceMax,
    inStock,
    inStockRaw,
    brandIds,
    categoryIds,
    term,
    attributeFilters,
    attributeRangeFilters,
  };
}
