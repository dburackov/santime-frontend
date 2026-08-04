import type { MetadataRoute } from 'next';
import { getSitemap } from '@/api/catalog';
import { SITE_URL } from '@/config/siteInfo';

// Карта сайта меняется вместе с каталогом, но не чаще — час достаточно.
export const revalidate = 3600;

/**
 * XML собирается здесь, а не в Spring: URL-структура витрины задаётся роутингом
 * Next, и держать её знание в двух местах — гарантированный рассинхрон при
 * первой же правке путей. Бэкенд отдаёт только слаги и даты изменения.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories, products } = await getSitemap({ revalidate });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/catalog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/dostavka`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/oplata`, changeFrequency: 'yearly', priority: 0.3 },
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
