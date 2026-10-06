import { SITE_NAME, SITE_URL } from '@/config/siteInfo';
import { buildOrganizationJsonLd } from './organizationJsonLd';

/**
 * schema.org/WebSite для главной. publisher ссылается на @id организации, а не
 * дублирует её данные, — поэтому обе сущности отдаются одним @graph.
 *
 * potentialAction/SearchAction намеренно нет, хотя страница результатов теперь есть:
 * /search?q= отдаётся под noindex и закрыта `Disallow: /*?*` в robots.ts, так что шаблон
 * рекламировал бы краулеру цель, которую ему же запрещено скачивать.
 */
export function buildWebSiteJsonLd(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'ru-BY',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

/** Обе сущности главной одним документом — @context задаётся здесь, на верхнем уровне. */
export function buildHomeJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [buildOrganizationJsonLd(), buildWebSiteJsonLd()],
  };
}
