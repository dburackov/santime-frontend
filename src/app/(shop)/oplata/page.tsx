import type { Metadata } from 'next';
export { PaymentPage as default } from '@/views/PaymentPage';

export const metadata: Metadata = {
  title: 'Оплата',
  description:
    'Способы оплаты в интернет-магазине Santime: наличными, картой и на расчётный счёт для юрлиц.',
  alternates: { canonical: '/oplata' },
};
