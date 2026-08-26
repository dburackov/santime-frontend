import type { Metadata } from 'next';
import { OG_IMAGE, SITE_NAME } from '@/config/siteInfo';
export { TermsPage as default } from '@/views/TermsPage';

const TITLE = 'Пользовательское соглашение';
const DESCRIPTION =
  'Правила продажи товаров и условия предоставления услуг santime.by: заказ, оплата, доставка, возврат и обмен.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/terms' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/terms',
    siteName: SITE_NAME,
    locale: 'ru_BY',
    type: 'website',
    images: [OG_IMAGE],
  },
};
