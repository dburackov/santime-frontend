'use client';

import './StickyBuyBar.css';
import { CurrencySymbol } from '@/components/ui/CurrencySymbol';
import { MinusIcon, PhoneIcon, PlusIcon } from '@/components/ui/icons';
import { SITE_PHONES } from '@/config/siteInfo';
import { formatPrice } from '@/utils/price';
import type { ProductCartState } from './useProductCart';

interface StickyBuyBarProps {
  price: number;
  cart: ProductCartState;
}

/** Нижний бар покупки на планшете и телефоне: сумма и «Купить», после покупки — степпер. */
export function StickyBuyBar({ price, cart }: StickyBuyBarProps) {
  const total = Math.round(price * cart.quantity * 100) / 100;

  return (
    <div className="sticky-buy-bar">
      <span className="sticky-buy-bar__total">
        {formatPrice(total)} <CurrencySymbol />
      </span>

      {!cart.inStock ? (
        <a href={SITE_PHONES[0].href} className="sticky-buy-bar__action">
          <PhoneIcon width={18} height={18} />
          Заказ по телефону
        </a>
      ) : cart.inCart ? (
        <div className="sticky-buy-bar__action sticky-buy-bar__stepper">
          <button
            type="button"
            className="sticky-buy-bar__step"
            onClick={cart.decrement}
            aria-label={cart.quantity <= 1 ? 'Убрать из корзины' : 'Уменьшить количество'}
          >
            <MinusIcon width={20} height={20} strokeWidth={2.2} />
          </button>
          <span className="sticky-buy-bar__count" aria-live="polite">
            <span className="sticky-buy-bar__count-value">{cart.quantity}</span>
            <span className="sticky-buy-bar__count-label">В корзине</span>
          </span>
          <button
            type="button"
            className="sticky-buy-bar__step"
            onClick={cart.increment}
            disabled={!cart.canIncrement}
            aria-label="Увеличить количество"
          >
            <PlusIcon width={20} height={20} strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        <button type="button" className="sticky-buy-bar__action" onClick={cart.buy}>
          Купить
        </button>
      )}
    </div>
  );
}
