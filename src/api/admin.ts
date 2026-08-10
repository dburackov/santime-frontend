import { apiRequest } from './client';
import type {
  AttributeOptionRequest,
  AttributeOptionResponse,
  AttributeRequest,
  AttributeResponse,
  BestsellerRequest,
  BestsellerResponse,
  BrandRequest,
  BrandResponse,
  CategoryAttributeRequest,
  CategoryAttributeResponse,
  CategoryAttributeUpdateRequest,
  CategoryRequest,
  CategoryResponse,
  OrderResponse,
  PageResponse,
  ProductImageAdminResponse,
  ProductImageFocalPointRequest,
  ProductRequest,
  ProductResponse,
  ProductVariantRequest,
  ProductVariantResponse,
  PromoCodeRequest,
  PromoCodeResponse,
} from './types';

// ---- Категории ----

export function listCategories(parentId?: number): Promise<CategoryResponse[]> {
  return apiRequest('/api/admin/categories', { searchParams: { parentId } });
}

export function getCategory(id: number): Promise<CategoryResponse> {
  return apiRequest(`/api/admin/categories/${id}`);
}

export function createCategory(body: CategoryRequest): Promise<CategoryResponse> {
  return apiRequest('/api/admin/categories', { method: 'POST', body });
}

export function updateCategory(id: number, body: CategoryRequest): Promise<CategoryResponse> {
  return apiRequest(`/api/admin/categories/${id}`, { method: 'PUT', body });
}

export function deleteCategory(id: number): Promise<void> {
  return apiRequest(`/api/admin/categories/${id}`, { method: 'DELETE' });
}

// ---- Бренды ----

export function listBrands(): Promise<BrandResponse[]> {
  return apiRequest('/api/admin/brands');
}

export function createBrand(body: BrandRequest): Promise<BrandResponse> {
  return apiRequest('/api/admin/brands', { method: 'POST', body });
}

export function updateBrand(id: number, body: BrandRequest): Promise<BrandResponse> {
  return apiRequest(`/api/admin/brands/${id}`, { method: 'PUT', body });
}

export function deleteBrand(id: number): Promise<void> {
  return apiRequest(`/api/admin/brands/${id}`, { method: 'DELETE' });
}

// ---- Атрибуты ----

export function listAttributes(): Promise<AttributeResponse[]> {
  return apiRequest('/api/admin/attributes');
}

export function createAttribute(body: AttributeRequest): Promise<AttributeResponse> {
  return apiRequest('/api/admin/attributes', { method: 'POST', body });
}

export function updateAttribute(id: number, body: AttributeRequest): Promise<AttributeResponse> {
  return apiRequest(`/api/admin/attributes/${id}`, { method: 'PUT', body });
}

export function deleteAttribute(id: number): Promise<void> {
  return apiRequest(`/api/admin/attributes/${id}`, { method: 'DELETE' });
}

// ---- Значения OPTION-атрибутов ----

export function listAttributeOptions(attributeId: number): Promise<AttributeOptionResponse[]> {
  return apiRequest(`/api/admin/attributes/${attributeId}/options`);
}

export function createAttributeOption(
  attributeId: number,
  body: AttributeOptionRequest,
): Promise<AttributeOptionResponse> {
  return apiRequest(`/api/admin/attributes/${attributeId}/options`, { method: 'POST', body });
}

export function updateAttributeOption(
  attributeId: number,
  optionId: number,
  body: AttributeOptionRequest,
): Promise<AttributeOptionResponse> {
  return apiRequest(`/api/admin/attributes/${attributeId}/options/${optionId}`, { method: 'PUT', body });
}

export function deleteAttributeOption(attributeId: number, optionId: number): Promise<void> {
  return apiRequest(`/api/admin/attributes/${attributeId}/options/${optionId}`, { method: 'DELETE' });
}

// ---- Привязка атрибутов к категории ----

export function listCategoryAttributes(categoryId: number): Promise<CategoryAttributeResponse[]> {
  return apiRequest(`/api/admin/categories/${categoryId}/attributes`);
}

export function createCategoryAttribute(
  categoryId: number,
  body: CategoryAttributeRequest,
): Promise<CategoryAttributeResponse> {
  return apiRequest(`/api/admin/categories/${categoryId}/attributes`, { method: 'POST', body });
}

export function updateCategoryAttribute(
  categoryId: number,
  attributeId: number,
  body: CategoryAttributeUpdateRequest,
): Promise<CategoryAttributeResponse> {
  return apiRequest(`/api/admin/categories/${categoryId}/attributes/${attributeId}`, {
    method: 'PUT',
    body,
  });
}

export function deleteCategoryAttribute(categoryId: number, attributeId: number): Promise<void> {
  return apiRequest(`/api/admin/categories/${categoryId}/attributes/${attributeId}`, {
    method: 'DELETE',
  });
}

// ---- Товары ----

export interface ListProductsParams {
  categoryId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export function listProducts(params: ListProductsParams): Promise<PageResponse<ProductResponse>> {
  return apiRequest('/api/admin/products', {
    searchParams: { categoryId: params.categoryId, page: params.page, size: params.size, sort: params.sort },
  });
}

export function getProduct(id: number): Promise<ProductResponse> {
  return apiRequest(`/api/admin/products/${id}`);
}

export function createProduct(body: ProductRequest): Promise<ProductResponse> {
  return apiRequest('/api/admin/products', { method: 'POST', body });
}

export function updateProduct(id: number, body: ProductRequest): Promise<ProductResponse> {
  return apiRequest(`/api/admin/products/${id}`, { method: 'PUT', body });
}

export function deleteProduct(id: number): Promise<void> {
  return apiRequest(`/api/admin/products/${id}`, { method: 'DELETE' });
}

// ---- Варианты товара ----

export function listProductVariants(productId: number): Promise<ProductVariantResponse[]> {
  return apiRequest(`/api/admin/products/${productId}/variants`);
}

export function getProductVariant(productId: number, id: number): Promise<ProductVariantResponse> {
  return apiRequest(`/api/admin/products/${productId}/variants/${id}`);
}

export function createProductVariant(
  productId: number,
  body: ProductVariantRequest,
): Promise<ProductVariantResponse> {
  return apiRequest(`/api/admin/products/${productId}/variants`, { method: 'POST', body });
}

export function updateProductVariant(
  productId: number,
  id: number,
  body: ProductVariantRequest,
): Promise<ProductVariantResponse> {
  return apiRequest(`/api/admin/products/${productId}/variants/${id}`, { method: 'PUT', body });
}

export function deleteProductVariant(productId: number, id: number): Promise<void> {
  return apiRequest(`/api/admin/products/${productId}/variants/${id}`, { method: 'DELETE' });
}

// ---- Фото товара (IMAGE-PIPELINE-SPEC.md, раздел 5.4/5.5) ----

export function listProductImages(productId: number): Promise<ProductImageAdminResponse[]> {
  return apiRequest(`/api/admin/products/${productId}/images`);
}

export function uploadProductImage(productId: number, file: File): Promise<ProductImageAdminResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest(`/api/admin/products/${productId}/images`, { method: 'POST', body: formData });
}

export function updateProductImageFocalPoint(
  productId: number,
  imageId: number,
  body: ProductImageFocalPointRequest,
): Promise<ProductImageAdminResponse> {
  return apiRequest(`/api/admin/products/${productId}/images/${imageId}`, { method: 'PATCH', body });
}

export function deleteProductImage(productId: number, imageId: number): Promise<void> {
  return apiRequest(`/api/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' });
}

// ---- Фото варианта товара (api.md, раздел 2.9) — идентично фото товара (2.8),
// но привязано к конкретному варианту (напр. другой цвет), путь с /variants/{variantId} ----

export function listVariantImages(productId: number, variantId: number): Promise<ProductImageAdminResponse[]> {
  return apiRequest(`/api/admin/products/${productId}/variants/${variantId}/images`);
}

export function uploadVariantImage(
  productId: number,
  variantId: number,
  file: File,
): Promise<ProductImageAdminResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest(`/api/admin/products/${productId}/variants/${variantId}/images`, {
    method: 'POST',
    body: formData,
  });
}

export function updateVariantImageFocalPoint(
  productId: number,
  variantId: number,
  imageId: number,
  body: ProductImageFocalPointRequest,
): Promise<ProductImageAdminResponse> {
  return apiRequest(`/api/admin/products/${productId}/variants/${variantId}/images/${imageId}`, {
    method: 'PATCH',
    body,
  });
}

export function deleteVariantImage(productId: number, variantId: number, imageId: number): Promise<void> {
  return apiRequest(`/api/admin/products/${productId}/variants/${variantId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

// ---- Заказы (только просмотр — смены статуса пока нет) ----

export interface ListOrdersParams {
  page?: number;
  size?: number;
  sort?: string;
}

export function listOrders(params: ListOrdersParams): Promise<PageResponse<OrderResponse>> {
  return apiRequest('/api/admin/orders', {
    searchParams: { page: params.page, size: params.size, sort: params.sort },
  });
}

export function getOrder(id: number): Promise<OrderResponse> {
  return apiRequest(`/api/admin/orders/${id}`);
}

// ---- Промокоды ----

export function listPromoCodes(): Promise<PromoCodeResponse[]> {
  return apiRequest('/api/admin/promo-codes');
}

export function createPromoCode(body: PromoCodeRequest): Promise<PromoCodeResponse> {
  return apiRequest('/api/admin/promo-codes', { method: 'POST', body });
}

/** Область действия перезаписывается целиком — запрос описывает желаемое состояние, а не дельту. */
export function updatePromoCode(id: number, body: PromoCodeRequest): Promise<PromoCodeResponse> {
  return apiRequest(`/api/admin/promo-codes/${id}`, { method: 'PUT', body });
}

export function deletePromoCode(id: number): Promise<void> {
  return apiRequest(`/api/admin/promo-codes/${id}`, { method: 'DELETE' });
}

export function listBestsellers(): Promise<BestsellerResponse[]> {
  return apiRequest('/api/admin/bestsellers');
}

export function createBestseller(body: BestsellerRequest): Promise<BestsellerResponse> {
  return apiRequest('/api/admin/bestsellers', { method: 'POST', body });
}

export function deleteBestseller(id: number): Promise<void> {
  return apiRequest(`/api/admin/bestsellers/${id}`, { method: 'DELETE' });
}

export function reorderBestsellers(ids: number[]): Promise<void> {
  return apiRequest('/api/admin/bestsellers/order', { method: 'PUT', body: { ids } });
}
