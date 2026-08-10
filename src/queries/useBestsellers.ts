'use client';

import { useQuery } from '@tanstack/react-query';
import { getBestsellers } from '@/api/catalog';
import { BESTSELLERS_QUERY_KEY } from '@/queries/bestsellersQueryKeys';
import { STOREFRONT_STALE_TIME } from '@/queries/staleTimes';

export function useBestsellers() {
  return useQuery({
    queryKey: BESTSELLERS_QUERY_KEY,
    queryFn: () => getBestsellers(),
    staleTime: STOREFRONT_STALE_TIME,
  });
}
