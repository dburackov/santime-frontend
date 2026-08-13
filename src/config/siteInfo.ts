export const SITE_NAME = 'Santime';

/**
 * Публичный адрес витрины. Нужен абсолютным: на него опирается metadataBase,
 * а значит canonical, Open Graph и sitemap.xml — относительные адреса там
 * поисковики трактуют неоднозначно.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const SITE_PHONES = [
  { display: '+375 (25) 787-87-87', href: 'tel:+375257878787' },
  { display: '+375 (44) 597-97-97', href: 'tel:+375445979797' },
];

export const SITE_HOURS = { label: 'Работаем ежедневно', value: '09:00 – 21:00' };

export const NAV_LINKS = [
  { to: '/', label: 'Главная' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/delivery', label: 'Доставка' },
  { to: '/payment', label: 'Оплата' },
];
