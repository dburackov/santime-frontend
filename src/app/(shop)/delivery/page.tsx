import type { Metadata } from 'next';
import { OG_IMAGE, SITE_NAME } from '@/config/siteInfo';
export { DeliveryPage as default } from '@/views/DeliveryPage';

const TITLE = 'Доставка';
const DESCRIPTION =
  'Условия и сроки доставки сантехники по Минску и Беларуси: зоны, стоимость, самовывоз.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/delivery' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/delivery',
    siteName: SITE_NAME,
    locale: 'ru_BY',
    type: 'website',
    images: [OG_IMAGE],
  },
};
