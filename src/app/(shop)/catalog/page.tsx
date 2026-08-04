import type { Metadata } from 'next';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getCategories } from '@/api/catalog';
import { createServerQueryClient } from '@/app/query-client';
import { CatalogPage } from '@/views/CatalogPage';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Каталог',
  description:
    'Полный каталог сантехники Santime по категориям: ванны, душевые кабины, смесители и другое. Доставка по Беларуси.',
  alternates: { canonical: '/catalog' },
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
