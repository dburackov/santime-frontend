'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getProducts } from '@/api/catalog';
import type { CatalogProductsQuery } from '@/api/types';

export function useCatalogProducts(query: CatalogProductsQuery, enabled = true) {
  return useQuery({
    queryKey: ['catalog-products', query],
    queryFn: () => getProducts(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}
