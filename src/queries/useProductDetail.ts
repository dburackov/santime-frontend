import { useQuery } from '@tanstack/react-query';
import { getProductBySlug } from '@/api/catalog';

export function useProductDetail(variantSlug: string | undefined) {
  return useQuery({
    queryKey: ['product-detail', variantSlug],
    queryFn: () => getProductBySlug(variantSlug as string),
    enabled: !!variantSlug,
  });
}
