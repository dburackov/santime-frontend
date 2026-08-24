'use client';

import { useContext } from 'react';
import { CartItemIdsContext } from './cart-context';

/** Лежит ли товар в корзине. Подписка только на состав — см. CartItemIdsContext. */
export function useIsInCart(variantId: number): boolean {
  const ids = useContext(CartItemIdsContext);
  if (!ids) throw new Error('useIsInCart must be used within a CartProvider');
  return ids.has(variantId);
}
