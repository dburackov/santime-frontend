'use client';

import { useQuery } from '@tanstack/react-query';
import { getKits } from '@/api/catalog';
import { KITS_QUERY_KEY } from '@/queries/kitsQueryKeys';

export function useKits() {
  return useQuery({
    queryKey: KITS_QUERY_KEY,
    queryFn: () => getKits(),
  });
}
