import type { NextConfig } from 'next';

// Адрес Spring для серверных вызовов и dev-прокси. В dev это localhost:8080 —
// ровно то же, что раньше делал proxy в vite.config.ts.
const API_ORIGIN = process.env.API_BASE_URL || 'http://localhost:8080';

const nextConfig: NextConfig = {
  // standalone включается только под флагом, который выставляет Dockerfile: с ним
  // не работает `next start` ("next start does not work with output: standalone"),
  // а локально сборка проверяется именно им.
  output: process.env.BUILD_STANDALONE ? 'standalone' : undefined,

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
