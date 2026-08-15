import { SITE_URL } from '@/config/siteInfo';
import { formatPriceMachine } from '@/utils/price';
import type { CategoryResponse, VariantDetailResponse } from '@/api/types';

type JsonLd = Record<string, unknown>;

/** schema.org/Product для карточки товара. */
export function buildProductJsonLd(variant: VariantDetailResponse, description: string): JsonLd {
  const url = `${SITE_URL}/product/${variant.variantSlug}`;
  // Первое изображение — главное: бэкенд отдаёт сначала фото варианта, затем
  // общие фото товара. zoom — готовый вариант 1200px.
  const heroZoom = variant.images?.[0]?.zoom;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name: variant.name,
    description,
    sku: variant.sku,
    url,
    ...(heroZoom ? { image: [heroZoom] } : {}),
    ...(variant.brandName ? { brand: { '@type': 'Brand', name: variant.brandName } } : {}),
    offers: {
      '@type': 'Offer',
      url,
      // Не formatPrice: здесь нужен машинный формат с точкой. String(price)
      // тоже не годится — он отдавал бы «159» там, где на странице «159,00».
      price: formatPriceMachine(variant.price),
      priceCurrency: 'BYN',
      availability:
        variant.stockQuantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(crumbs: Crumb[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

export function buildProductCrumbs(
  variant: VariantDetailResponse,
  categories: CategoryResponse[] | undefined,
): Crumb[] {
  const category = categories?.find((c) => c.id === variant.categoryId);
  return [
    { name: 'Главная', path: '/' },
    { name: 'Каталог', path: '/catalog' },
    ...(category ? [{ name: category.name, path: `/category/${category.slug}` }] : []),
    { name: variant.name, path: `/product/${variant.variantSlug}` },
  ];
}
