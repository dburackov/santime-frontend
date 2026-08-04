import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/admin',
        '/cart',
        '/checkout',
        '/order-confirmation',
        // Фильтры категории живут в query-string и дают бесконечное число почти
        // одинаковых URL. Серверный noindex для них поставить нельзя: чтение
        // searchParams выключило бы ISR всего роута (см. category/[slug]/page.tsx),
        // поэтому отсекаем их здесь. Каноническим остаётся чистый адрес категории.
        '/*?*',
      ],
    },
  };
}
