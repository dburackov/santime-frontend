import { apiRequest, apiRequestFile, type DownloadedFile } from './client';
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
  AdminOrderUpdateRequest,
  OrderResponse,
  OrderStatus,
  PageResponse,
  PriceImportResponse,
  ProductImageAdminResponse,
  ProductImageAltRequest,
  ProductGroupAxisRequest,
  ProductGroupRequest,
  ProductGroupResponse,
  ProductGroupRowResponse,
  ProductVariantRequest,
  ProductVariantResponse,
  ProductVariantSiblingRequest,
  ProductVariantUpdateRequest,
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

/** Фото есть только у корневой категории; подкатегории бэкенд отклоняет с 400. */
export function uploadCategoryImage(id: number, file: File): Promise<CategoryResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest(`/api/admin/categories/${id}/image`, { method: 'POST', body: formData });
}

export function deleteCategoryImage(id: number): Promise<void> {
  return apiRequest(`/api/admin/categories/${id}/image`, { method: 'DELETE' });
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

/** ids — attributeId в нужном порядке: у связки категория-атрибут своего id наружу нет. */
export function reorderCategoryAttributes(categoryId: number, ids: number[]): Promise<void> {
  return apiRequest(`/api/admin/categories/${categoryId}/attributes/order`, { method: 'PUT', body: { ids } });
}

// ---- Позиции (продаваемые единицы) ----

export function getVariant(id: number): Promise<ProductVariantResponse> {
  return apiRequest(`/api/admin/variants/${id}`);
}

export function createVariant(body: ProductVariantRequest): Promise<ProductVariantResponse> {
  return apiRequest('/api/admin/variants', { method: 'POST', body });
}

/** Новое исполнение существующей позиции: непереданное копируется с исходной. */
export function createVariantSibling(
  sourceId: number,
  body: ProductVariantSiblingRequest,
): Promise<ProductVariantResponse> {
  return apiRequest(`/api/admin/variants/${sourceId}/sibling`, { method: 'POST', body });
}

export function updateVariant(
  id: number,
  body: ProductVariantUpdateRequest,
): Promise<ProductVariantResponse> {
  return apiRequest(`/api/admin/variants/${id}`, { method: 'PUT', body });
}

export function deleteVariant(id: number): Promise<void> {
  return apiRequest(`/api/admin/variants/${id}`, { method: 'DELETE' });
}

// ---- Группа исполнений: только чтение и оси вариативности ----

export interface ListProductGroupsParams {
  categoryId?: number;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

/** Список товаров админки: страница считает модели, каждая приходит со всеми исполнениями. */
export function listProductGroups(
  params: ListProductGroupsParams,
): Promise<PageResponse<ProductGroupRowResponse>> {
  return apiRequest('/api/admin/product-groups', {
    searchParams: {
      categoryId: params.categoryId,
      search: params.search,
      page: params.page,
      size: params.size,
      sort: params.sort,
    },
  });
}

export function getProductGroup(id: number): Promise<ProductGroupResponse> {
  return apiRequest(`/api/admin/product-groups/${id}`);
}

/** Бренд и описание модели: применяются ко всем её исполнениям. */
export function updateProductGroup(id: number, body: ProductGroupRequest): Promise<ProductGroupResponse> {
  return apiRequest(`/api/admin/product-groups/${id}`, { method: 'PUT', body });
}

export function replaceProductGroupAxes(
  id: number,
  body: ProductGroupAxisRequest[],
): Promise<ProductGroupResponse> {
  return apiRequest(`/api/admin/product-groups/${id}/axes`, { method: 'PUT', body });
}

// ---- Фото позиции (IMAGE-PIPELINE-SPEC.md, раздел 5.4/5.5) ----

export function listVariantImages(variantId: number): Promise<ProductImageAdminResponse[]> {
  return apiRequest(`/api/admin/variants/${variantId}/images`);
}

export function uploadVariantImage(variantId: number, file: File): Promise<ProductImageAdminResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest(`/api/admin/variants/${variantId}/images`, { method: 'POST', body: formData });
}

export function updateVariantImageAlt(
  variantId: number,
  imageId: number,
  body: ProductImageAltRequest,
): Promise<ProductImageAdminResponse> {
  return apiRequest(`/api/admin/variants/${variantId}/images/${imageId}`, { method: 'PATCH', body });
}

export function deleteVariantImage(variantId: number, imageId: number): Promise<void> {
  return apiRequest(`/api/admin/variants/${variantId}/images/${imageId}`, { method: 'DELETE' });
}

export function reorderVariantImages(variantId: number, ids: number[]): Promise<void> {
  return apiRequest(`/api/admin/variants/${variantId}/images/order`, { method: 'PUT', body: { ids } });
}

// ---- Общие фото модели: на витрине приклеиваются к галерее каждого её исполнения ----

export function listGroupImages(groupId: number): Promise<ProductImageAdminResponse[]> {
  return apiRequest(`/api/admin/product-groups/${groupId}/images`);
}

export function uploadGroupImage(groupId: number, file: File): Promise<ProductImageAdminResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest(`/api/admin/product-groups/${groupId}/images`, { method: 'POST', body: formData });
}

export function updateGroupImageAlt(
  groupId: number,
  imageId: number,
  body: ProductImageAltRequest,
): Promise<ProductImageAdminResponse> {
  return apiRequest(`/api/admin/product-groups/${groupId}/images/${imageId}`, { method: 'PATCH', body });
}

export function deleteGroupImage(groupId: number, imageId: number): Promise<void> {
  return apiRequest(`/api/admin/product-groups/${groupId}/images/${imageId}`, { method: 'DELETE' });
}

export function reorderGroupImages(groupId: number, ids: number[]): Promise<void> {
  return apiRequest(`/api/admin/product-groups/${groupId}/images/order`, { method: 'PUT', body: { ids } });
}

// ---- Заказы (состав после оформления не меняется, правятся только контакты и статус) ----

export interface ListOrdersParams {
  status?: OrderStatus;
  page?: number;
  size?: number;
  sort?: string;
}

export function listOrders(params: ListOrdersParams): Promise<PageResponse<OrderResponse>> {
  return apiRequest('/api/admin/orders', {
    searchParams: { status: params.status, page: params.page, size: params.size, sort: params.sort },
  });
}

export function getOrder(id: number): Promise<OrderResponse> {
  return apiRequest(`/api/admin/orders/${id}`);
}

export function updateOrder(id: number, body: AdminOrderUpdateRequest): Promise<OrderResponse> {
  return apiRequest(`/api/admin/orders/${id}`, { method: 'PUT', body });
}

export function getOrderReceipt(id: number): Promise<DownloadedFile> {
  return apiRequestFile(`/api/admin/orders/${id}/receipt`);
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

export function reorderCategories(ids: number[]): Promise<void> {
  return apiRequest('/api/admin/categories/order', { method: 'PUT', body: { ids } });
}

export function reorderBestsellers(ids: number[]): Promise<void> {
  return apiRequest('/api/admin/bestsellers/order', { method: 'PUT', body: { ids } });
}

// ---- Прайс-лист ----

export function importPrices(file: File): Promise<PriceImportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/api/admin/price-import', { method: 'POST', body: formData });
}
