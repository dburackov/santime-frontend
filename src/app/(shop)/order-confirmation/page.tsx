import type { Metadata } from 'next';
export { OrderConfirmationPage as default } from '@/views/OrderConfirmationPage';

// Индексировать нечего: состояние живёт в localStorage конкретного браузера.
export const metadata: Metadata = {
  title: 'Заказ оформлен',
  robots: { index: false, follow: false },
};
