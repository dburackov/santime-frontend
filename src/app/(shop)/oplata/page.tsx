import type { Metadata } from 'next';
import { SITE_NAME } from '@/config/siteInfo';
export { PaymentPage as default } from '@/views/PaymentPage';

const TITLE = 'Оплата';
const DESCRIPTION =
  'Способы оплаты в интернет-магазине Santime: наличными, картой и на расчётный счёт для юрлиц.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/oplata' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/oplata',
    siteName: SITE_NAME,
    locale: 'ru_BY',
    type: 'website',
  },
};
