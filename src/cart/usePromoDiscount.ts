'use client';

import { useQuery } from '@tanstack/react-query';
import { validatePromoCode } from '@/api/promo';
import type { PromoRejectionReason } from '@/api/types';
import { useCart } from './useCart';

export interface PromoDiscount {
  /** Сумма позиций до скидки. */
  subtotal: number;
  discountAmount: number;
  /** Итог к оплате: subtotal - discountAmount. */
  totalPrice: number;
  /** Промокод введён и принят сервером. */
  isApplied: boolean;
  /** Промокод введён, но отклонён. */
  isRejected: boolean;
  reason: PromoRejectionReason | null;
  message: string | null;
  isPending: boolean;
}

/**
 * Скидка — производная величина, а не сохранённое состояние.
 *
 * Корзина лежит в localStorage и меняется когда угодно, поэтому запомненная
 * сумма скидки почти сразу перестаёт соответствовать составу (особенно при
 * минимальной сумме заказа и ограничении по категориям). Ключ запроса включает
 * и код, и состав корзины: изменилась корзина — react-query сам сходит за
 * новым расчётом. Итог всегда приходит с сервера.
 */
export function usePromoDiscount(): PromoDiscount {
  const { items, promoCode, totalPrice } = useCart();

  const payloadItems = items.map((item) => ({
    productVariantId: item.variantId,
    quantity: item.quantity,
  }));

  const query = useQuery({
    queryKey: ['promo-discount', promoCode, payloadItems],
    queryFn: () => validatePromoCode({ code: promoCode as string, items: payloadItems }),
    enabled: Boolean(promoCode) && payloadItems.length > 0,
    staleTime: 60 * 1000,
  });

  const result = query.data;
  if (!promoCode || !result) {
    return {
      subtotal: totalPrice,
      discountAmount: 0,
      totalPrice,
      isApplied: false,
      isRejected: false,
      reason: null,
      message: null,
      isPending: query.isPending && query.fetchStatus !== 'idle',
    };
  }

  return {
    subtotal: result.subtotal,
    discountAmount: result.discountAmount,
    totalPrice: result.totalPrice,
    isApplied: result.valid,
    isRejected: !result.valid,
    reason: result.reason,
    message: result.message,
    isPending: query.isFetching,
  };
}
