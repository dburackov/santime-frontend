'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getProducts } from '@/api/catalog';
import { STOREFRONT_STALE_TIME } from '@/queries/staleTimes';
import type { CatalogProductsQuery } from '@/api/types';

export function useCatalogProducts(query: CatalogProductsQuery, enabled = true) {
  return useQuery({
    queryKey: ['catalog-products', query],
    queryFn: () => getProducts(query),
    enabled,
    staleTime: STOREFRONT_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}
