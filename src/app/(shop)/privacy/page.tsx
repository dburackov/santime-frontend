import type { Metadata } from 'next';
import { SITE_NAME } from '@/config/siteInfo';
export { PrivacyPage as default } from '@/views/PrivacyPage';

const TITLE = 'Политика обработки персональных данных';
const DESCRIPTION =
  'Какие персональные данные собирает santime.by, зачем и на каком основании их обрабатывает, кому передаёт, сколько хранит и как отозвать согласие.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/privacy',
    siteName: SITE_NAME,
    locale: 'ru_BY',
    type: 'website',
  },
};
