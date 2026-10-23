'use client';

import { useState } from 'react';
import { useCart } from '@/cart/useCart';
import type { VariantDetailResponse } from '@/api/types';

/**
 * Количество на странице товара — одно на карточку покупки и нижний бар. Пока товара
 * нет в корзине, это черновик; как только положили — степпер правит саму корзину,
 * поэтому значение верно и после перезагрузки, и после правки в /cart.
 */
export function useProductCart(variant: VariantDetailResponse) {
  const { items, addItem, setQuantity, removeItem } = useCart();
  const [draft, setDraft] = useState(1);
  const cartItem = items.find((item) => item.variantId === variant.variantId);
  const stock = variant.stockQuantity;
  const quantity = cartItem?.quantity ?? Math.min(draft, Math.max(stock, 1));

  const increment = () => {
    if (cartItem) setQuantity(variant.variantId, Math.min(stock, cartItem.quantity + 1));
    else setDraft((current) => Math.min(stock, current + 1));
  };

  const decrement = () => {
    if (!cartItem) setDraft((current) => Math.max(1, current - 1));
    else if (cartItem.quantity <= 1) removeItem(variant.variantId);
    else setQuantity(variant.variantId, cartItem.quantity - 1);
  };

  const buy = () => {
    if (cartItem || stock === 0) return;
    // Диалога нет — отклик даёт сама кнопка, шапке остаётся пульс.
    addItem(
      {
        variantId: variant.variantId,
        variantSlug: variant.variantSlug,
        productName: variant.name,
        price: variant.price,
        attributes: variant.attributes,
        image: variant.images?.[0] ?? null,
      },
      Math.min(draft, stock),
      { silent: true },
    );
  };

  return {
    inCart: !!cartItem,
    inStock: stock > 0,
    quantity,
    canIncrement: quantity < stock,
    increment,
    decrement,
    buy,
  };
}

export type ProductCartState = ReturnType<typeof useProductCart>;
