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
  return apiRequest('/api/admin/categories');
}

export function getBrands(): Promise<BrandResponse[]> {
  return apiRequest('/api/admin/brands');
}

export function getCategoryFilters(categoryId: number): Promise<CatalogFilterAttributeResponse[]> {
  return apiRequest(`/api/catalog/categories/${categoryId}/filters`);
}

export function getProducts(query: CatalogProductsQuery): Promise<PageResponse<VariantCardResponse>> {
  const searchParams: Record<string, string | number | boolean | undefined> = {
    categoryId: query.categoryId,
    brandId: query.brandId,
    priceMin: query.priceMin,
    priceMax: query.priceMax,
    inStock: query.inStock,
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
