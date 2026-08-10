'use client';

import { useQuery } from '@tanstack/react-query';
import { getBestsellers } from '@/api/catalog';
import { BESTSELLERS_QUERY_KEY } from '@/queries/bestsellersQueryKeys';

export function useBestsellers() {
  return useQuery({
    queryKey: BESTSELLERS_QUERY_KEY,
    queryFn: () => getBestsellers(),
  });
}
