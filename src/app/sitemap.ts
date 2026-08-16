import type { MetadataRoute } from 'next';
import { getSitemap } from '@/api/catalog';
import type { SitemapEntryResponse } from '@/api/types';
import { SITE_URL } from '@/config/siteInfo';

// Карта сайта меняется вместе с каталогом, но не чаще — час достаточно.
export const revalidate = 3600;

/**
 * XML собирается здесь, а не в Spring: URL-структура витрины задаётся роутингом
 * Next, и держать её знание в двух местах — гарантированный рассинхрон при
 * первой же правке путей. Бэкенд отдаёт только слаги и даты изменения.
 *
 * Недоступный бэкенд не должен ронять сборку: этот роут пререндерится на
 * `next build`, и без catch любая сетевая ошибка валит весь образ. Отдаём тогда
 * одни статические маршруты — ISR перегенерирует карту через revalidate.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let categories: SitemapEntryResponse[] = [];
  let products: SitemapEntryResponse[] = [];
  try {
    ({ categories, products } = await getSitemap({ revalidate }));
  } catch (error) {
    console.error('sitemap: бэкенд недоступен, отдаём только статические маршруты', error);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/catalog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/discounts`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/delivery`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/payment`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  return [
    ...staticRoutes,
    ...categories.map((entry) => ({
      url: `${SITE_URL}/category/${entry.slug}`,
      lastModified: new Date(entry.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...products.map((entry) => ({
      url: `${SITE_URL}/product/${entry.slug}`,
      lastModified: new Date(entry.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
