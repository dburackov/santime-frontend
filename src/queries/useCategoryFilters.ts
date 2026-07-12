import { useQuery } from '@tanstack/react-query';
import { getCategoryFilters } from '@/api/catalog';

export function useCategoryFilters(categoryId: number | undefined) {
  return useQuery({
    queryKey: ['category-filters', categoryId],
    queryFn: () => getCategoryFilters(categoryId as number),
    enabled: categoryId !== undefined,
    staleTime: 60 * 1000,
  });
}
