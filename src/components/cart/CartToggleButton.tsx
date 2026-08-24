'use client';

import { useRouter } from 'next/navigation';
import './CartToggleButton.css';
import { Button } from '@/components/ui/Button';
import { CartIcon, CheckIcon } from '@/components/ui/icons';
import type { VariantCardResponse } from '@/api/types';
import { useCartActions } from '@/cart/useCartActions';
import { useIsInCart } from '@/cart/useIsInCart';

interface CartToggleButtonProps {
  variant: VariantCardResponse;
  /** Текстовая кнопка вместо иконки — так свёрстана строка списка. */
  showLabel?: boolean;
  className?: string;
}

/**
 * Кнопка корзины каталога — одна на плитку и на строку списка: положить товар,
 * а если он уже внутри — перейти в корзину. Подписи те же, что на странице
 * товара: «Купить» и «В корзине».
 */
export function CartToggleButton({ variant, showLabel = false, className }: CartToggleButtonProps) {
  const { addItem } = useCartActions();
  const inCart = useIsInCart(variant.variantId);
  const router = useRouter();

  const label = inCart ? 'В корзине' : 'Купить';
  const iconHint = inCart ? 'Уже в корзине, перейти' : 'В корзину';

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
    <Button
      size="sm"
      className={[
        'cart-toggle',
        showLabel ? '' : 'cart-toggle--icon',
        inCart ? 'cart-toggle--in-cart' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={showLabel ? undefined : iconHint}
      title={showLabel ? undefined : iconHint}
      disabled={!variant.inStock}
      onClick={handleClick}
    >
      {showLabel ? label : inCart ? <CheckIcon width={18} height={18} /> : <CartIcon width={18} height={18} />}
    </Button>
  );
}
