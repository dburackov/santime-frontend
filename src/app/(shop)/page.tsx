import type { Metadata } from 'next';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getCategories, getProducts } from '@/api/catalog';
import { createServerQueryClient } from '@/app/query-client';
import { buildOrganizationJsonLd } from '@/utils/organizationJsonLd';
import { SITE_NAME } from '@/config/siteInfo';
import { HomePage } from '@/views/HomePage';

export const revalidate = 3600;

const DESCRIPTION =
  'Интернет-магазин сантехники Santime: каталог с точными характеристиками и фильтрами, доставка по Минску и области, гарантия на каждый товар.';

export const metadata: Metadata = {
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE_NAME} — интернет-магазин сантехники`,
    description: DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    locale: 'ru_BY',
    type: 'website',
  },
};

// Должно совпадать с аргументом useCatalogProducts в HomePage — из него
// собирается ключ react-query, по которому клиент подхватывает префетч.
const HITS_QUERY = { sort: 'NAME_ASC', size: 8 } as const;

export default async function Page() {
  const queryClient = createServerQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: () => getCategories({ revalidate }),
    }),
    queryClient.prefetchQuery({
      queryKey: ['catalog-products', HITS_QUERY],
      queryFn: () => getProducts(HITS_QUERY, { revalidate }),
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HomePage />
      </HydrationBoundary>
    </>
  );
}
