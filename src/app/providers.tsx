'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { CartProvider } from '@/cart/CartContext';

export function Providers({ children }: { children: ReactNode }) {
  // QueryClient создаётся в состоянии, а не в модуле: модульный экземпляр на
  // сервере был бы общим для всех запросов, то есть данные одного посетителя
  // утекали бы другому.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            // staleTime здесь не задаётся: он свой у каждой группы запросов,
            // см. queries/staleTimes.ts.
          },
        },
      }),
  );

  // AuthProvider живёт не здесь, а в app/admin/layout.tsx: его эффект дёргает
  // /admin/auth/refresh при монтировании, и отсюда этот запрос уходил с каждой
  // страницы витрины — у анонимного посетителя в том числе.
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CartProvider>{children}</CartProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
