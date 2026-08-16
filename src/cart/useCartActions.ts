'use client';

import { useContext } from 'react';
import { CartActionsContext } from './cart-context';

/**
 * Только действия над корзиной, без её состояния. Для компонентов, которые
 * кладут товар, но ничего из корзины не показывают: подписка на useCart
 * перерисовывала бы их при каждом изменении содержимого.
 */
export function useCartActions() {
  const ctx = useContext(CartActionsContext);
  if (!ctx) throw new Error('useCartActions must be used within a CartProvider');
  return ctx;
}
