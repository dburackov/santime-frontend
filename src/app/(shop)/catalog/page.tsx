import type { Metadata } from 'next';
import { SITE_NAME } from '@/config/siteInfo';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getCategories } from '@/api/catalog';
import { getPublicPromoCodes } from '@/api/promo';
import { createServerQueryClient } from '@/app/query-client';
import { PUBLIC_PROMO_CODES_QUERY_KEY } from '@/queries/promoQueryKeys';
import { PromoSlider } from '@/components/layout/PromoSlider';
import { CatalogPage } from '@/views/CatalogPage';

export const revalidate = 3600;

const TITLE = 'Каталог';
const DESCRIPTION =
  'Полный каталог сантехники Santime по категориям: смесители, унитазы, радиаторы отопления. Доставка по Беларуси.';

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
  },
};

export default async function Page() {
  const queryClient = createServerQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: () => getCategories({ revalidate }),
    }),
    queryClient.prefetchQuery({
      queryKey: PUBLIC_PROMO_CODES_QUERY_KEY,
      queryFn: () => getPublicPromoCodes({ revalidate }),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PromoSlider />
      <CatalogPage />
    </HydrationBoundary>
  );
}
