export type AttributeType = 'NUMBER' | 'BOOLEAN' | 'OPTION';

export type AttributeValue = string | number | boolean;

export interface ErrorResponse {
  message: string;
  errors: Record<string, string> | null;
}

// ---- Авторизация администратора (ADMIN-AUTH-SPEC.md, api.md §0) ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateAdminRequest {
  email: string;
}

export interface CreateAdminResponse {
  email: string;
  temporaryPassword: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ---- Каталог (публичное API) ----

export interface CatalogFilterOption {
  value: string;
  count: number;
}

export interface CatalogFilterAttributeResponse {
  name: string;
  slug: string;
  type: AttributeType;
  unit: string | null;
  options: CatalogFilterOption[] | null;
  values: string[] | null;
}

/**
 * Готовый набор для рендера одного фото (см. IMAGE-PIPELINE-SPEC.md, 5.3).
 * Бэкенд подписывает URL и собирает srcset сам — фронт только подставляет значения.
 * Опционально, т.к. пока бэкенд эту секцию не отдаёт (нет фото) — компонент фото
 * должен уметь показать плейсхолдер при отсутствии этого поля.
 */
export interface ProductImageResponse {
  id: number;
  alt: string;
  srcset: string;
  fallback: string;
  zoom: string;
}

export interface VariantCardResponse {
  variantId: number;
  variantSlug: string;
  groupId: number;
  name: string;
  categoryId: number;
  brandId: number | null;
  price: number;
  oldPrice: number | null;
  inStock: boolean;
  attributes: Record<string, AttributeValue>;
  images?: ProductImageResponse[];
}

export interface SitemapEntryResponse {
  slug: string;
  updatedAt: string;
}

export interface SitemapResponse {
  categories: SitemapEntryResponse[];
  products: SitemapEntryResponse[];
}

export type CatalogSort = 'NAME_ASC' | 'NAME_DESC' | 'PRICE_ASC' | 'PRICE_DESC' | 'DISCOUNT_DESC';

export interface CatalogProductsQuery {
  categoryId?: number;
  brandIds?: number[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  name?: string;
  discounted?: boolean;
  sort?: CatalogSort;
  page?: number;
  size?: number;
  /** slug -> "value" or "value1,value2" (equality/OR) for OPTION/BOOLEAN */
  attributeFilters?: Record<string, string>;
  /** slug -> {min?, max?} for NUMBER attributes */
  attributeRangeFilters?: Record<string, { min?: number; max?: number }>;
}

export interface VariantDetailAttributeMeta {
  name: string;
  slug: string;
  type: AttributeType;
  unit: string | null;
  required: boolean;
}

export interface VariantOptionItem {
  variantId: number;
  variantSlug: string;
  /** Сырое значение из JSONB: у BOOLEAN-оси это true/false, у NUMBER — число. */
  value: AttributeValue;
  current: boolean;
  /**
   * Есть ли исполнение, отличающееся от текущего только по этой оси.
   * false — такого сочетания в продаже нет, ссылка ведёт к ближайшему подходящему.
   */
  available: boolean;
  inStock: boolean;
}

export interface VariantOptionGroup {
  attributeSlug: string;
  attributeName: string;
  options: VariantOptionItem[];
}

export interface VariantDetailResponse {
  variantId: number;
  variantSlug: string;
  name: string;
  sku: string;
  price: number;
  oldPrice: number | null;
  stockQuantity: number;
  weightKg: number | null;
  attributes: Record<string, AttributeValue>;
  groupId: number;
  description: string | null;
  categoryId: number;
  brandId: number | null;
  brandName: string | null;
  attributeMetadata: VariantDetailAttributeMeta[];
  variantOptions: VariantOptionGroup[];
  images?: ProductImageResponse[];
}

// ---- Админское API ----

/** Фото категории. Форма ProductImageResponse без id: отдельной строки под фото нет. */
export interface CategoryImageResponse {
  alt: string;
  srcset: string;
  fallback: string;
  zoom: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  parentCategoryId: number | null;
  sortOrder: number;
  /** Число активных товаров во всём поддереве категории, а не только привязанных к ней напрямую. */
  productCount: number;
  /** Заводится только у корневых категорий, у остальных всегда null. */
  image: CategoryImageResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRequest {
  name: string;
  slug: string;
  parentCategoryId: number | null;
}

export interface BrandResponse {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}

export interface BrandRequest {
  name: string;
  slug: string;
}

export interface AttributeResponse {
  id: number;
  name: string;
  slug: string;
  type: AttributeType;
  unit: string | null;
}

export interface AttributeRequest {
  name: string;
  slug: string;
  type: AttributeType;
  unit?: string | null;
}

export interface AttributeOptionResponse {
  id: number;
  value: string;
}

export interface AttributeOptionRequest {
  value: string;
}

export interface CategoryAttributeResponse {
  attributeId: number;
  attributeName: string;
  attributeSlug: string;
  attributeType: AttributeType;
  attributeUnit: string | null;
  required: boolean;
  isFilter: boolean;
  sortOrder: number;
}

export interface CategoryAttributeRequest {
  attributeId: number;
  required: boolean;
  isFilter: boolean;
}

export type CategoryAttributeUpdateRequest = Omit<CategoryAttributeRequest, 'attributeId'>;

/** Группа исполнений: сама по себе не заводится, живёт вместе с позициями. */
export interface ProductGroupResponse {
  id: number;
  categoryId: number;
  brandId: number | null;
  description: string | null;
  axes: ProductGroupAxisResponse[];
  variants: ProductGroupVariantResponse[];
  createdAt: string;
  updatedAt: string;
}

/** Ось вариативности — атрибут, по которому различаются исполнения этой группы. */
export interface ProductGroupAxisResponse {
  attributeId: number;
  attributeName: string;
  attributeSlug: string;
  attributeType: AttributeType;
  attributeUnit: string | null;
  sortOrder: number;
}

export interface ProductGroupAxisRequest {
  attributeId: number;
  sortOrder: number;
}

export interface ProductGroupVariantResponse {
  id: number;
  name: string;
  sku: string;
  active: boolean;
  axisValues: Record<string, AttributeValue>;
}

/**
 * Строка списка товаров админки: модель со всеми исполнениями. Страница считает модели,
 * поэтому исполнения одной модели никогда не разрываются пагинацией.
 */
export interface ProductGroupRowResponse {
  id: number;
  categoryId: number;
  brandId: number | null;
  description: string | null;
  /** Полное число исполнений модели: при поиске в variants приходят только совпавшие. */
  variantTotal: number;
  axes: ProductGroupAxisResponse[];
  variants: ProductVariantResponse[];
}

/** Поля модели: общие для всех её исполнений. Категории нет — она неизменяема. */
export interface ProductGroupRequest {
  brandId: number | null;
  description: string | null;
}

export interface ProductVariantResponse {
  id: number;
  groupId: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  oldPrice: number | null;
  stockQuantity: number;
  weightKg: number | null;
  active: boolean;
  attributes: Record<string, AttributeValue>;
  categoryId: number;
  brandId: number | null;
  description: string | null;
  images?: ProductImageResponse[];
  createdAt: string;
  updatedAt: string;
}

/** Заведение новой позиции — вместе с ней создаётся её группа. */
export interface ProductVariantRequest {
  name: string;
  slug: string;
  sku: string;
  price: number;
  oldPrice?: number | null;
  stockQuantity: number;
  weightKg?: number | null;
  active: boolean;
  attributes: Record<string, AttributeValue>;
  categoryId: number;
  brandId?: number | null;
  description?: string | null;
}

/** Правка позиции. Категории нет: она задаётся при создании и не меняется. */
/** Правка позиции: полей модели здесь нет, они правятся у группы. */
export type ProductVariantUpdateRequest = Omit<
  ProductVariantRequest,
  'categoryId' | 'brandId' | 'description'
>;

/** Новое исполнение: непереданное копируется с исходной позиции. */
export type ProductVariantSiblingRequest = Omit<
  ProductVariantRequest,
  'categoryId' | 'brandId' | 'description'
>;

// ---- Импорт из внешнего источника (админка) ----

export interface ExternalProductRequest {
  url: string;
  categoryId: number;
}

/** Характеристика источника, которую не удалось положить на нашу модель. */
export interface ExternalAttributeSkip {
  label: string;
  value: string;
  reason: string;
}

/**
 * Данные для предзаполнения формы товара. Артикула и slug здесь нет намеренно:
 * их задаёт администратор. brandId приходит, только если такой бренд уже заведён.
 */
export interface ExternalProductResponse {
  name: string;
  price: number;
  brandId: number | null;
  brandName: string;
  description: string;
  attributes: Record<string, AttributeValue>;
  skipped: ExternalAttributeSkip[];
}

// ---- Фото товара (админка) ----

/**
 * Ответ на загрузку/список фото в админке (IMAGE-PIPELINE-SPEC.md, 5.4/5.5).
 * originalUrl — прямая ссылка на оригинал в MinIO (бакет публичный на чтение,
 * см. раздел 2 спеки) — нужна только для превью в гриде админки,
 * реальные srcset для витрины строит бэкенд отдельно (ProductImageResponse).
 */
export interface ProductImageAdminResponse {
  id: number;
  sortOrder: number;
  altText: string | null;
  originalUrl: string;
}

export interface ProductImageAltRequest {
  altText?: string | null;
}

// ---- Заказы ----

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItemRequest {
  productVariantId: number;
  quantity: number;
}

export interface OrderRequest {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  paymentMethod: string;
  deliveryMethod: string;
  comment?: string | null;
  /** Код промокода. Скидку сервер считает сам, с фронта сумма не принимается. */
  promoCode?: string | null;
  items: OrderItemRequest[];
}

export interface OrderItemResponse {
  id: number;
  productVariantId: number;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
}

/** Правка заказа оператором: контакты, доставка и статус. Состав и суммы не меняются. */
export interface AdminOrderUpdateRequest {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  paymentMethod: string;
  deliveryMethod: string;
  comment?: string | null;
  status: OrderStatus;
}

export interface OrderResponse {
  id: number;
  status: OrderStatus;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  paymentMethod: string;
  deliveryMethod: string;
  comment: string | null;
  /** Снапшот применённого кода, null если промокода не было. */
  promoCode: string | null;
  /** Сумма позиций до скидки. */
  subtotal: number;
  discountAmount: number;
  /** Итог к оплате, всегда subtotal - discountAmount. */
  totalPrice: number;
  createdAt: string;
  items: OrderItemResponse[];
}

// ---- Промокоды ----

export type DiscountType = 'PERCENT' | 'FIXED_AMOUNT';

export interface PromoCodeRequest {
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  /** Сравнивается с subtotal всей корзины, а не с суммой подходящих позиций. */
  minOrderAmount?: number | null;
  /**
   * LocalDateTime без таймзоны: «2026-06-01T00:00». Это не момент времени в UTC,
   * поэтому строку из <input type="datetime-local"> отправляем как есть — прогон
   * через Date/toISOString сдвинул бы границу действия на смещение часового пояса.
   */
  validFrom?: string | null;
  validUntil?: string | null;
  active: boolean;
  /** Показывать в слайдере на витрине. Независимо от active. */
  publicVisible: boolean;
  /** Область действия. Все три пустые = промокод на весь заказ. */
  categoryIds: number[];
  brandIds: number[];
  productIds: number[];
}

export interface PromoCodeResponse {
  id: number;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  publicVisible: boolean;
  categoryIds: number[];
  brandIds: number[];
  productIds: number[];
  createdAt: string;
}

export type PromoRejectionReason =
  | 'NOT_FOUND'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'EXPIRED'
  | 'MIN_ORDER_NOT_REACHED'
  | 'NO_MATCHING_ITEMS';

export interface PromoCodeValidateRequest {
  code: string;
  items: OrderItemRequest[];
}

/**
 * Приходит со статусом 200 и при отказе тоже: «промокод не подошёл» — это
 * результат проверки, а не ошибка запроса. Причина лежит в reason, готовый
 * текст для покупателя — в message.
 */
export interface PromoCodeValidateResponse {
  valid: boolean;
  code: string;
  reason: PromoRejectionReason | null;
  message: string | null;
  subtotal: number;
  discountAmount: number;
  totalPrice: number;
}

export interface PromoCodeBannerResponse {
  code: string;
  description: string | null;
}

export interface BestsellerResponse {
  id: number;
  productVariantId: number;
  sortOrder: number;
  productName: string;
  variantSku: string;
  variantSlug: string;
  price: number;
}

export interface BestsellerRequest {
  productVariantId: number;
  sortOrder: number;
}

export interface PriceImportResponse {
  updated: number;
  unchanged: number;
  activated: number;
  deactivated: number;
}
