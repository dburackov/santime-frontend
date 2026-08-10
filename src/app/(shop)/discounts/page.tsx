import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getDiscountedBrands, getProducts } from '@/api/catalog';
import { buildCatalogQuery } from '@/hooks/catalogQuery';
import { DISCOUNTS_PAGE_OPTIONS } from '@/queries/discountsQuery';
import { DISCOUNTED_BRANDS_QUERY_KEY } from '@/queries/useDiscountedBrands';
import { createServerQueryClient } from '@/app/query-client';
import { VIEW_MODE_COOKIE, parseViewMode } from '@/hooks/viewMode';
import { SITE_NAME } from '@/config/siteInfo';
import { DiscountsPage } from '@/views/DiscountsPage';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

const DESCRIPTION =
  'Сантехника со скидкой в Santime: смесители, унитазы, ванны и радиаторы по сниженным ценам. Доставка по Минску и всей Беларуси.';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const hasFilters = Object.keys(await searchParams).some((key) => key !== 'page');

  return {
    title: 'Скидки на сантехнику',
    description: DESCRIPTION,
    alternates: { canonical: '/discounts' },
    openGraph: {
      title: 'Скидки на сантехнику',
      description: DESCRIPTION,
      url: '/discounts',
      siteName: SITE_NAME,
      locale: 'ru_BY',
      type: 'website',
    },
    ...(hasFilters ? { robots: { index: false, follow: true } } : {}),
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

  const query = buildCatalogQuery(undefined, toURLSearchParams(await searchParams), [], DISCOUNTS_PAGE_OPTIONS);

  const viewMode = parseViewMode((await cookies()).get(VIEW_MODE_COOKIE)?.value);

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['catalog-products', query],
      queryFn: () => getProducts(query),
    }),
    queryClient.prefetchQuery({
      queryKey: DISCOUNTED_BRANDS_QUERY_KEY,
      queryFn: () => getDiscountedBrands(),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DiscountsPage initialViewMode={viewMode} />
    </HydrationBoundary>
  );
}
