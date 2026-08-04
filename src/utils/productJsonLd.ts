import { pickSrcsetUrl } from '@/utils/images';
import type { VariantDetailResponse } from '@/api/types';

/**
 * schema.org/Product для карточки товара.
 *
 * Состав полей намеренно повторяет прежнюю клиентскую версию один-в-один:
 * задача переезда — не потерять разметку, а не расширить её. Обогащение
 * (sku, brand, availability, description) относится к отдельной SEO-задаче.
 */
export function buildProductJsonLd(variant: VariantDetailResponse): Record<string, unknown> | null {
  const hero = variant.images?.[0];
  if (!hero) return null;

  const zoomUrl = pickSrcsetUrl(hero.srcset, 1200) ?? hero.fallback;

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: variant.productName,
    image: [zoomUrl],
    offers: { '@type': 'Offer', price: String(variant.price), priceCurrency: 'BYN' },
  };
}
