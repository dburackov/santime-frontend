import { useQuery } from '@tanstack/react-query';
import { getBrands } from '@/api/catalog';

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: getBrands,
    staleTime: 5 * 60 * 1000,
  });
}
