import type { Metadata } from 'next';
export { CartPage as default } from '@/views/CartPage';

// Индексировать нечего: состояние живёт в localStorage конкретного браузера.
export const metadata: Metadata = {
  title: 'Корзина',
  robots: { index: false, follow: false },
};
