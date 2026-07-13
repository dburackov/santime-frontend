import { useQuery } from '@tanstack/react-query';
import { getCategoryBrands } from '@/api/catalog';

export function useBrands(categoryId: number | undefined) {
  return useQuery({
    queryKey: ['brands', categoryId],
    queryFn: () => getCategoryBrands(categoryId as number),
    enabled: categoryId !== undefined,
    staleTime: 5 * 60 * 1000,
  });
}
