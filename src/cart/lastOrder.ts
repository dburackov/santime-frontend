import type { OrderResponse, ProductImageResponse } from '@/api/types';

const STORAGE_KEY = 'santime-last-order';

/**
 * Оформленный заказ передаётся с чекаута на страницу подтверждения. Раньше он
 * ехал в state роутера react-router, которого в Next нет.
 *
 * sessionStorage, а не localStorage: заказ нужен ровно на время вкладки и не
 * должен всплывать в новой сессии. Побочно это чинит и старое поведение —
 * подтверждение теперь переживает F5, а не сваливается в заглушку. Публичного
 * эндпоинта чтения одного заказа у бэкенда нет, иначе правильнее было бы
 * ходить за ним по ?orderId=.
 */
export interface LastOrder {
  order: OrderResponse;
  /** Фото позиций по productVariantId из корзины: в ответе заказа картинок нет. */
  images: Record<number, ProductImageResponse | null>;
}

export function saveLastOrder(lastOrder: LastOrder): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lastOrder));
  } catch {
    // приватный режим или переполненное хранилище — подтверждение просто
    // покажет обобщённый текст, заказ при этом уже создан
  }
}

export function loadLastOrder(): LastOrder | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<LastOrder>) : null;
    return parsed?.order ? { order: parsed.order, images: parsed.images ?? {} } : null;
  } catch {
    return null;
  }
}
