import { CATEGORY_SORT_VALUES, type CatalogQueryOptions } from '@/hooks/catalogQuery';

/** Дефолт и пункты селектора страницы поиска. Читают и серверный префетч, и клиентский хук. */
export const SEARCH_PAGE_OPTIONS: CatalogQueryOptions = {
  readSearchTerm: true,
  // Сортировки по релевантности у бэкенда нет. POPULAR_DESC уже используется выпадашкой,
  // поэтому первая страница выдачи совпадает с её верхом; PRICE_ASC задрал бы наверх мелочь.
  defaultSort: 'POPULAR_DESC',
  allowedSorts: CATEGORY_SORT_VALUES,
};

/**
 * Терм входит в ключ, поэтому ключ — фабрика, и живёт она здесь, а не рядом с хуком:
 * экспорт функции из модуля с 'use client' становится клиентской ссылкой, и серверный
 * префетч не может её вызвать.
 */
export const searchFacetsQueryKey = (term: string) => ['search-facets', term] as const;
