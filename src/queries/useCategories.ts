'use client';

import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/api/catalog';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    // Обёрнуто в стрелку намеренно: react-query передаёт в queryFn свой контекст,
    // а getCategories теперь принимает опции кэширования для серверных вызовов.
    queryFn: () => getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}
