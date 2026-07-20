import { apiRequest } from './client';
import type {
  BrandResponse,
  CatalogFilterAttributeResponse,
  CatalogProductsQuery,
  CategoryResponse,
  PageResponse,
  VariantCardResponse,
  VariantDetailResponse,
} from './types';

export function getCategories(): Promise<CategoryResponse[]> {
  return apiRequest('/api/catalog/categories');
}

export function getCategoryBrands(categoryId: number): Promise<BrandResponse[]> {
  return apiRequest(`/api/catalog/categories/${categoryId}/brands`);
}

export function getCategoryFilters(categoryId: number): Promise<CatalogFilterAttributeResponse[]> {
  return apiRequest(`/api/catalog/categories/${categoryId}/filters`);
}

export function getProducts(query: CatalogProductsQuery): Promise<PageResponse<VariantCardResponse>> {
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

  return apiRequest('/api/catalog/products', { searchParams });
}

export function getProductBySlug(variantSlug: string): Promise<VariantDetailResponse> {
  return apiRequest(`/api/catalog/products/${encodeURIComponent(variantSlug)}`);
}
