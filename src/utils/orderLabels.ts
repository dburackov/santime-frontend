import type { OrderStatus } from '@/api/types';

/** Значения оплаты, доставки и статуса — сырые коды бэкенда; подписи для человека живут здесь. */
export const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Картой онлайн' },
  { value: 'CASH', label: 'Наличными при получении' },
];

export const DELIVERY_METHODS = [
  { value: 'COURIER', label: 'Курьером' },
  { value: 'PICKUP', label: 'Самовывоз' },
];

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'NEW', label: 'Новый' },
  { value: 'CONFIRMED', label: 'Подтверждён' },
  { value: 'DELIVERED', label: 'Доставлен' },
  { value: 'CANCELLED', label: 'Отменён' },
];

function labelOf(options: { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function paymentMethodLabel(value: string): string {
  return labelOf(PAYMENT_METHODS, value);
}

export function deliveryMethodLabel(value: string): string {
  return labelOf(DELIVERY_METHODS, value);
}

export function orderStatusLabel(value: OrderStatus): string {
  return labelOf(ORDER_STATUSES, value);
}
