import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@/index.css';
import { THEME_INIT_SCRIPT } from '@/theme/theme-script';
import { Providers } from './providers';

export const metadata: Metadata = {
  // Шаблон: страницы задают только свою часть заголовка через generateMetadata,
  // а если не задают — показывается default.
  title: {
    default: 'Santime — интернет-магазин сантехники',
    template: '%s — Santime',
  },
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning — data-theme проставляется скриптом ниже до
    // гидрации, поэтому атрибут на <html> заведомо расходится с серверной
    // разметкой. Подавление действует только на сам <html>, не на потомков.
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
