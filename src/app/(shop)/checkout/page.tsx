import type { Metadata } from 'next';
export { CheckoutPage as default } from '@/views/CheckoutPage';

// Индексировать нечего: состояние живёт в localStorage конкретного браузера.
export const metadata: Metadata = {
  title: 'Оформление заказа',
  robots: { index: false, follow: false },
};
