import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getProducts, getSearchFacets } from '@/api/catalog';
import {
  SEARCH_TERM_PARAM,
  buildCatalogQuery,
  isUsableSearchTerm,
  normalizeSearchTerm,
} from '@/hooks/catalogQuery';
import { SEARCH_PAGE_OPTIONS, searchFacetsQueryKey } from '@/queries/searchQuery';
import { createServerQueryClient } from '@/app/query-client';
import { VIEW_MODE_COOKIE, parseViewMode } from '@/hooks/viewMode';
import { SearchPage } from '@/views/SearchPage';

// Контент — функция query-string, как и у категории: без force-dynamic useSearchParams
// в клиентском поддереве уводит список из HTML.
export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

const DESCRIPTION = 'Поиск сантехники в каталоге Santime по названию и артикулу.';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const raw = (await searchParams)[SEARCH_TERM_PARAM];
  const term = normalizeSearchTerm(Array.isArray(raw) ? raw[0] : raw);

  return {
    title: term ? `Поиск «${term}»` : 'Поиск',
    description: DESCRIPTION,
    // noindex безусловный, а не только под фильтрами, как на /discounts: любое состояние
    // страницы — тонкая выдача бесконечной мощности. Canonical и OG намеренно нет:
    // canonical на /search объявил бы ?q=смеситель и ?q=унитаз одним документом,
    // а self-canonical с термом рекламировал бы noindex-URL.
    robots: { index: false, follow: true },
  };
}

function toURLSearchParams(input: SearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else if (value !== undefined) params.set(key, value);
  }
  return params;
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const queryClient = createServerQueryClient();

  const params = toURLSearchParams(await searchParams);
  const term = normalizeSearchTerm(params.get(SEARCH_TERM_PARAM));
  const query = buildCatalogQuery(undefined, params, [], SEARCH_PAGE_OPTIONS);

  const viewMode = parseViewMode((await cookies()).get(VIEW_MODE_COOKIE)?.value);

  // Терм в пропы не уходит: вид берёт его из того же нормализатора через useSearchParams,
  // поэтому серверная разметка и первый клиентский рендер совпадают по построению.
  if (isUsableSearchTerm(term)) {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['catalog-products', query],
        queryFn: () => getProducts(query),
      }),
      queryClient.prefetchQuery({
        queryKey: searchFacetsQueryKey(term),
        queryFn: () => getSearchFacets(term),
      }),
    ]);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchPage initialViewMode={viewMode} />
    </HydrationBoundary>
  );
}
