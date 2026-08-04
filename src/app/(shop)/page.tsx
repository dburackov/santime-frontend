import type { Metadata } from 'next';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getCategories, getProducts } from '@/api/catalog';
import { createServerQueryClient } from '@/app/query-client';
import { HomePage } from '@/views/HomePage';

export const revalidate = 3600;

export const metadata: Metadata = {
  description:
    'Интернет-магазин сантехники Santime: каталог с точными характеристиками и фильтрами, доставка по Минску и области, гарантия на каждый товар.',
  alternates: { canonical: '/' },
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
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  );
}
