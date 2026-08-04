import type { Metadata } from 'next';
export { DeliveryPage as default } from '@/views/DeliveryPage';

export const metadata: Metadata = {
  title: 'Доставка',
  description:
    'Условия и сроки доставки сантехники по Минску и Беларуси: зоны, стоимость, самовывоз.',
  alternates: { canonical: '/dostavka' },
};
