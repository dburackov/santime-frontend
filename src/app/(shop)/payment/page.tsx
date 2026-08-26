import type { Metadata } from 'next';
import { OG_IMAGE, SITE_NAME } from '@/config/siteInfo';
export { PaymentPage as default } from '@/views/PaymentPage';

const TITLE = 'Оплата';
const DESCRIPTION =
  'Способы оплаты в интернет-магазине Santime: наличными, картой и на расчётный счёт для юрлиц.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/payment' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/payment',
    siteName: SITE_NAME,
    locale: 'ru_BY',
    type: 'website',
    images: [OG_IMAGE],
  },
};
