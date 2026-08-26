import type { Metadata } from 'next';
import { OG_IMAGE, SITE_NAME } from '@/config/siteInfo';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getCategories } from '@/api/catalog';
import { createServerQueryClient } from '@/app/query-client';
import { CatalogPage } from '@/views/CatalogPage';

export const revalidate = 3600;

const TITLE = 'Каталог';
const DESCRIPTION =
  'Полный каталог сантехники Santime по категориям с гарантией и доставкой по Минске и всей Беларуси.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/catalog' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/catalog',
    siteName: SITE_NAME,
    locale: 'ru_BY',
    type: 'website',
    images: [OG_IMAGE],
  },
};

export default async function Page() {
  const queryClient = createServerQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ revalidate }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CatalogPage />
    </HydrationBoundary>
  );
}
