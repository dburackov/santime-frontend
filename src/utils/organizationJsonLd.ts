import { SITE_NAME, SITE_PHONES, SITE_URL } from '@/config/siteInfo';

/**
 * schema.org/Organization для главной. Логотип — favicon.svg: растрового
 * логотипа в проекте нет, а Google для расширенных сниппетов предпочитает
 * растр, так что при появлении PNG сюда стоит подставить его.
 */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    telephone: SITE_PHONES.map((phone) => phone.display),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'BY',
    },
  };
}
