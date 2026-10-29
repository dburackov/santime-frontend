'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { quoteCart } from '@/api/cart';
import { CART_STALE_TIME } from '@/queries/staleTimes';
import { useCart } from './useCart';

export const CART_QUOTE_QUERY_KEY = 'cart-quote';

/** Почему позицию нельзя заказать как есть. */
export type CartLineIssue = 'unavailable' | 'out-of-stock' | 'insufficient-stock';

export interface CartLineQuote {
  price: number;
  /** Цена на момент добавления, если с тех пор она изменилась. */
  previousPrice: number | null;
  /** Остаток на складе; null, пока сервер не ответил. */
  stockQuantity: number | null;
  issue: CartLineIssue | null;
}

export interface CartQuote {
  lines: Record<number, CartLineQuote>;
  /** Штук в позициях, которые войдут в заказ. */
  count: number;
  subtotal: number;
  discountAmount: number;
  totalPrice: number;
  /** Есть позиции, с которыми заказ не оформить. */
  hasIssues: boolean;
  promoApplied: boolean;
  promoRejected: boolean;
  promoMessage: string | null;
  /** Идёт проверка введённого промокода. */
  promoPending: boolean;
  /** Сервер ответил хотя бы раз (или упал — тогда остаётся снапшот). */
  isReady: boolean;
}

/**
 * Корзина в localStorage хранит снапшот цены на момент добавления, а правду о
 * ней знает только сервер: цены, наличие и скидку пересчитывает /api/cart/quote.
 * Снапшот — запасной вариант на случай, если сервер не ответил, и база для «цена изменилась».
 */
export function useCartQuote(): CartQuote {
  const { items, promoCode, totalPrice, totalCount } = useCart();

  const payloadItems = items.map((item) => ({
    productVariantId: item.variantId,
    quantity: item.quantity,
  }));

  const query = useQuery({
    queryKey: [CART_QUOTE_QUERY_KEY, promoCode, payloadItems],
    queryFn: () => quoteCart({ promoCode, items: payloadItems }),
    enabled: payloadItems.length > 0,
    staleTime: CART_STALE_TIME,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  const result = query.data;
  const promoPending = Boolean(promoCode) && query.isFetching;
  const quoted = new Map(result?.items.map((line) => [line.productVariantId, line]));

  const lines: Record<number, CartLineQuote> = {};
  let count = 0;
  for (const item of items) {
    const line = quoted.get(item.variantId);
    if (!line) {
      lines[item.variantId] = { price: item.price, previousPrice: null, stockQuantity: null, issue: null };
      count += item.quantity;
      continue;
    }
    const price = line.price ?? item.price;
    let issue: CartLineIssue | null = null;
    if (!line.available) issue = 'unavailable';
    else if (line.stockQuantity === 0) issue = 'out-of-stock';
    else if (item.quantity > line.stockQuantity) issue = 'insufficient-stock';
    lines[item.variantId] = {
      price,
      previousPrice: line.available && price !== item.price ? item.price : null,
      stockQuantity: line.available ? line.stockQuantity : 0,
      issue,
    };
    if (!issue) count += item.quantity;
  }

  if (!result) {
    return {
      lines,
      count: totalCount,
      subtotal: totalPrice,
      discountAmount: 0,
      totalPrice,
      hasIssues: false,
      promoApplied: false,
      promoRejected: false,
      promoMessage: null,
      promoPending,
      isReady: query.isError,
    };
  }

  const promo = promoCode ? result.promo : null;
  return {
    lines,
    count,
    subtotal: result.subtotal,
    discountAmount: result.discountAmount,
    totalPrice: result.totalPrice,
    hasIssues: Object.values(lines).some((line) => line.issue),
    promoApplied: promo?.applied ?? false,
    promoRejected: promo ? !promo.applied : false,
    promoMessage: promo?.message ?? null,
    promoPending,
    isReady: true,
  };
}
