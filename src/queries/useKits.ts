'use client';

import { useQuery } from '@tanstack/react-query';
import { getKits } from '@/api/catalog';
import { KITS_QUERY_KEY } from '@/queries/kitsQueryKeys';
import { STOREFRONT_STALE_TIME } from '@/queries/staleTimes';

export function useKits() {
  return useQuery({
    queryKey: KITS_QUERY_KEY,
    queryFn: () => getKits(),
    staleTime: STOREFRONT_STALE_TIME,
  });
}
