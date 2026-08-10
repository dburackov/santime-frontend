import type { NextConfig } from 'next';

// Адрес Spring для серверных вызовов и dev-прокси. В dev это localhost:8080 —
// ровно то же, что раньше делал proxy в vite.config.ts.
const API_ORIGIN = process.env.API_BASE_URL || 'http://localhost:8080';

const nextConfig: NextConfig = {
  // output: 'standalone' сознательно НЕ включён: с ним не работает `next start`
  // ("next start does not work with output: standalone"), а проверять сборку
  // локально нужно именно им. Включим вместе с Dockerfile перед предпродом.

  // Замена vite-прокси: браузер продолжает ходить на /api того же origin.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },

  // Яндекс — главная цель переезда, поэтому его нужно гарантированно
  // обслуживать как HTML-ограниченного бота: цельный документ с метаданными
  // в <head>, а не стриминг, независимо от дефолтного списка Next.
  htmlLimitedBots: /Yandex/,
};

export default nextConfig;
