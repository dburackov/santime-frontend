import { apiRequest } from './client';
import type {
  BrandResponse,
  CatalogFilterAttributeResponse,
  CatalogProductsQuery,
  CategoryResponse,
  PageResponse,
  VariantCardResponse,
  SitemapResponse,
  VariantDetailResponse,
} from './types';

/**
 * Опции серверного вызова. Страницы витрины передают сюда своё окно ISR, чтобы
 * fetch попал в кэш данных Next; из браузера вызывается без аргумента.
 */
export interface CatalogFetchOptions {
  revalidate?: number;
}

export function getCategories(opts: CatalogFetchOptions = {}): Promise<CategoryResponse[]> {
  return apiRequest('/api/catalog/categories', opts);
}

export function getCategoryBrands(categoryId: number, opts: CatalogFetchOptions = {}): Promise<BrandResponse[]> {
  return apiRequest(`/api/catalog/categories/${categoryId}/brands`, opts);
}

export function getCategoryFilters(categoryId: number, opts: CatalogFetchOptions = {}): Promise<CatalogFilterAttributeResponse[]> {
  return apiRequest(`/api/catalog/categories/${categoryId}/filters`, opts);
}

export function getProducts(
  query: CatalogProductsQuery,
  opts: CatalogFetchOptions = {},
): Promise<PageResponse<VariantCardResponse>> {
  const searchParams: Record<string, string | number | boolean | undefined> = {
    categoryId: query.categoryId,
    brandIds: query.brandIds?.length ? query.brandIds.join(',') : undefined,
    priceMin: query.priceMin,
    priceMax: query.priceMax,
    inStock: query.inStock,
    name: query.name,
    sort: query.sort,
    page: query.page,
    size: query.size,
  };

  for (const [slug, value] of Object.entries(query.attributeFilters ?? {})) {
    searchParams[slug] = value;
  }

  for (const [slug, range] of Object.entries(query.attributeRangeFilters ?? {})) {
    if (range.min !== undefined) searchParams[`${slug}_min`] = range.min;
    if (range.max !== undefined) searchParams[`${slug}_max`] = range.max;
  }

  return apiRequest('/api/catalog/products', { searchParams, ...opts });
}

export function getProductBySlug(
  variantSlug: string,
  opts: CatalogFetchOptions = {},
): Promise<VariantDetailResponse> {
  return apiRequest(`/api/catalog/products/${encodeURIComponent(variantSlug)}`, opts);
}

export function getSitemap(opts: CatalogFetchOptions = {}): Promise<SitemapResponse> {
  return apiRequest('/api/catalog/sitemap', opts);
}
