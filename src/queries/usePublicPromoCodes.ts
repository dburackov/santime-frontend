'use client';

import { useQuery } from '@tanstack/react-query';
import { getPublicPromoCodes } from '@/api/promo';
import { PUBLIC_PROMO_CODES_QUERY_KEY } from './promoQueryKeys';

export function usePublicPromoCodes() {
  return useQuery({
    queryKey: PUBLIC_PROMO_CODES_QUERY_KEY,
    queryFn: () => getPublicPromoCodes(),
    staleTime: 5 * 60 * 1000,
  });
}
