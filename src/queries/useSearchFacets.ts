'use client';

import { useQuery } from '@tanstack/react-query';
import { getSearchFacets } from '@/api/catalog';
import { isUsableSearchTerm } from '@/hooks/catalogQuery';
import { REFERENCE_STALE_TIME } from '@/queries/staleTimes';
import { searchFacetsQueryKey } from '@/queries/searchQuery';

export function useSearchFacets(term: string) {
  return useQuery({
    queryKey: searchFacetsQueryKey(term),
    // enabled обязателен: с пустым name бэкенд отвечает 400.
    enabled: isUsableSearchTerm(term),
    queryFn: () => getSearchFacets(term),
    staleTime: REFERENCE_STALE_TIME,
  });
}
