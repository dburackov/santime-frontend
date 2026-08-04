import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/config/siteInfo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // Пагинация — единственный query-параметр, ведущий на действительно другой
      // контент, поэтому она исключена из общего запрета ниже. Allow должен идти
      // раньше Disallow: при равной длине правил приоритет у первого совпадения.
      allow: ['/', '/*?page='],
      disallow: [
        '/admin',
        '/api/admin',
        '/cart',
        '/checkout',
        '/order-confirmation',
        // Фильтры категории живут в query-string и дают бесконечное число почти
        // одинаковых URL. Серверный noindex для них тоже стоит, но до страницы
        // лучше вовсе не пускать — экономия краулингового бюджета.
        '/*?*',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
