import { QueryClient } from '@tanstack/react-query';

/**
 * Одноразовый QueryClient для серверного префетча. Именно одноразовый: общий
 * экземпляр на модуле расшарил бы кэш между запросами разных посетителей.
 */
export function createServerQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: 1 } } });
}
