import type { OrderStatus } from '@/api/types';

/** Значения оплаты, доставки и статуса — сырые коды бэкенда; подписи для человека живут здесь. */
export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Наличными или картой при получении' },
  { value: 'CARD', label: 'Онлайн-оплата (E-POS)' },
];

export const DELIVERY_METHODS = [
  { value: 'COURIER', label: 'Курьером' },
  { value: 'PICKUP', label: 'Самовывоз' },
  { value: 'CARRIER', label: 'Транспортной компанией' },
];

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'NEW', label: 'Новый' },
  { value: 'CONFIRMED', label: 'Подтверждён' },
  { value: 'DELIVERED', label: 'Доставлен' },
  { value: 'CANCELLED', label: 'Отменён' },
];

/**
 * Рабочая цепочка статусов. CANCELLED в неё не входит: отмена — не шаг вперёд,
 * её ставят из формы редактирования, а шаг назад возвращает заказ в работу.
 */
const ORDER_STATUS_FLOW: OrderStatus[] = ['NEW', 'CONFIRMED', 'DELIVERED'];

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  if (index < 0) return null;
  return ORDER_STATUS_FLOW[index + 1] ?? null;
}

export function previousOrderStatus(status: OrderStatus): OrderStatus | null {
  if (status === 'CANCELLED') return 'NEW';
  const index = ORDER_STATUS_FLOW.indexOf(status);
  return index > 0 ? ORDER_STATUS_FLOW[index - 1] : null;
}

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
