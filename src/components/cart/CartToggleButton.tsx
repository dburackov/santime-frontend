'use client';

import { useRouter } from 'next/navigation';
import './CartToggleButton.css';
import { CartIcon, CheckIcon } from '@/components/ui/icons';
import type { VariantCardResponse } from '@/api/types';
import { useCartActions } from '@/cart/useCartActions';
import { useIsInCart } from '@/cart/useIsInCart';

interface CartToggleButtonProps {
  variant: VariantCardResponse;
  className?: string;
}

/**
 * Кнопка корзины каталога — одна на плитку и на строку списка: положить товар,
 * а если он уже внутри — перейти в корзину. Подписи те же, что на странице
 * товара: «Купить» и «В корзине».
 */
export function CartToggleButton({ variant, className }: CartToggleButtonProps) {
  const { addItem } = useCartActions();
  const inCart = useIsInCart(variant.variantId);
  const router = useRouter();

  function handleClick() {
    if (inCart) {
      router.push('/cart');
      return;
    }
    addItem({
      variantId: variant.variantId,
      variantSlug: variant.variantSlug,
      productName: variant.name,
      price: variant.price,
      attributes: variant.attributes,
      image: variant.images?.[0] ?? null,
    });
  }

  return (
    <button
      type="button"
      className={['cart-toggle', inCart ? 'cart-toggle--in-cart' : '', className].filter(Boolean).join(' ')}
      disabled={!variant.inStock}
      onClick={handleClick}
    >
      {inCart ? <CheckIcon width={16} height={16} /> : <CartIcon width={16} height={16} />}
      {inCart ? 'В корзине' : 'Купить'}
    </button>
  );
}
