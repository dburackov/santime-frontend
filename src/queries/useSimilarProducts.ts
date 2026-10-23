'use client';

import { useQuery } from '@tanstack/react-query';
import { getSimilarProducts } from '@/api/catalog';
import { similarProductsQueryKey } from '@/queries/similarProductsQueryKey';
import { STOREFRONT_STALE_TIME } from '@/queries/staleTimes';

export function useSimilarProducts(variantSlug: string) {
  return useQuery({
    queryKey: similarProductsQueryKey(variantSlug),
    queryFn: () => getSimilarProducts(variantSlug),
    staleTime: STOREFRONT_STALE_TIME,
  });
}
