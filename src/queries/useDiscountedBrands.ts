'use client';

import { useQuery } from '@tanstack/react-query';
import { getDiscountedBrands } from '@/api/catalog';

export const DISCOUNTED_BRANDS_QUERY_KEY = ['discounted-brands'] as const;

export function useDiscountedBrands() {
  return useQuery({
    queryKey: DISCOUNTED_BRANDS_QUERY_KEY,
    queryFn: () => getDiscountedBrands(),
  });
}
