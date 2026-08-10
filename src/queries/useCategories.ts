'use client';

import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/api/catalog';
import { REFERENCE_STALE_TIME } from '@/queries/staleTimes';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    // Обёрнуто в стрелку намеренно: react-query передаёт в queryFn свой контекст,
    // а getCategories теперь принимает опции кэширования для серверных вызовов.
    queryFn: () => getCategories(),
    staleTime: REFERENCE_STALE_TIME,
  });
}
