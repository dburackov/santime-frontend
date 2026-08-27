'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/api/catalog';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 6;

export function useProductSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query.trim(), 350);
  const enabled = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const { data, isFetching } = useQuery({
    queryKey: ['product-search', debouncedQuery],
    queryFn: () => getProducts({ name: debouncedQuery, size: RESULT_LIMIT, sort: 'POPULAR_DESC' }),
    enabled,
  });

  return {
    results: enabled ? (data?.content ?? []) : [],
    isSearching: enabled && isFetching,
    isQueryTooShort: query.trim().length > 0 && !enabled,
  };
}
