export type AttributeType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OPTION';

export type AttributeValue = string | number | boolean;

export interface ErrorResponse {
  message: string;
  errors: Record<string, string> | null;
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
  minValue: number | null;
  maxValue: number | null;
}

export interface VariantCardResponse {
  variantId: number;
  variantSlug: string;
  productId: number;
  productName: string;
  productSlug: string;
  categoryId: number;
  brandId: number | null;
  price: number;
  inStock: boolean;
  attributes: Record<string, AttributeValue>;
}

export type CatalogSort = 'NAME_ASC' | 'NAME_DESC' | 'PRICE_ASC' | 'PRICE_DESC';

export interface CatalogProductsQuery {
  categoryId?: number;
  brandId?: number;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  sort?: CatalogSort;
  page?: number;
  size?: number;
  /** slug -> "value" or "value1,value2" (equality/OR) for STRING/OPTION/BOOLEAN */
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
  value: string;
  current: boolean;
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
  sku: string;
  price: number;
  stockQuantity: number;
  weightKg: number | null;
  attributes: Record<string, AttributeValue>;
  productId: number;
  productName: string;
  productSlug: string;
  description: string | null;
  categoryId: number;
  brandId: number | null;
  attributeMetadata: VariantDetailAttributeMeta[];
  variantOptions: VariantOptionGroup[];
}

// ---- Категории / бренды (админское API, используется витриной только для чтения) ----

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  parentCategoryId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandResponse {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}
