'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/api/catalog';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { isUsableSearchTerm, normalizeSearchTerm } from '@/hooks/catalogQuery';

const RESULT_LIMIT = 20;

export function useProductSearch(query: string) {
  // Порог и нормализация общие со страницей поиска: разъехавшись, подсказка «Введите ещё
  // символ…» перестала бы совпадать с пустым состоянием /search.
  const debouncedQuery = useDebouncedValue(normalizeSearchTerm(query), 350);
  const enabled = isUsableSearchTerm(debouncedQuery);

  const { data, isFetching } = useQuery({
    queryKey: ['product-search', debouncedQuery],
    queryFn: () => getProducts({ name: debouncedQuery, size: RESULT_LIMIT, sort: 'POPULAR_DESC' }),
    enabled,
  });

  return {
    results: enabled ? (data?.content ?? []) : [],
    isSearching: enabled && isFetching,
    isQueryTooShort: normalizeSearchTerm(query).length > 0 && !enabled,
  };
}
