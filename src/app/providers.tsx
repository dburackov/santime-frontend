'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { CartProvider } from '@/cart/CartContext';
import { AuthProvider } from '@/auth/AuthProvider';

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
            // staleTime намеренно нулевой. Страницы витрины ISR-кэшируются, и
            // именно рефетч при монтировании подменяет возможно устаревшую цену
            // из кэша на актуальную. Ненулевой staleTime это сломает.
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <CartProvider>{children}</CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
