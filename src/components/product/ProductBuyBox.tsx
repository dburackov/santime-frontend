'use client';

import './ProductBuyBox.css';
import Link from 'next/link';
import { Price } from '@/components/ui/Price';
import { VariantOptions } from './VariantOptions';
import { SkuCopy } from './SkuCopy';
import {
  ArrowRightIcon,
  BulletListIcon,
  ChevronDownIcon,
  MinusIcon,
  PhoneIcon,
  PlusIcon,
  TruckIcon,
} from '@/components/ui/icons';
import { SITE_PHONES } from '@/config/siteInfo';
import type { ProductCartState } from './useProductCart';
import type { VariantDetailResponse } from '@/api/types';

const LOW_STOCK = 5;

interface ProductBuyBoxProps {
  variant: VariantDetailResponse;
  cart: ProductCartState;
  onJump: (sectionId: 'characteristics' | 'delivery') => void;
}

export function ProductBuyBox({ variant, cart, onJump }: ProductBuyBoxProps) {
  const phone = SITE_PHONES[0];
  const stock = variant.stockQuantity;

  return (
    <div className="product-buy-box">
      <div className="product-buy-box__head">
        <h1 className="product-buy-box__title">{variant.name}</h1>
        <div className="product-buy-box__meta">
          <SkuCopy sku={variant.sku} />
          <span className={`product-buy-box__stock${stock > 0 ? '' : ' product-buy-box__stock--out'}`}>
            <span className="product-buy-box__stock-dot" aria-hidden="true" />
            {stock > 0
              ? `В наличии${stock <= LOW_STOCK ? ` — осталось ${stock}` : ''}`
              : 'Нет в наличии'}
          </span>
        </div>
        <span className="product-buy-box__mobile-price">
          <Price value={variant.price} oldValue={variant.oldPrice} size="lg" className="product-buy-box__price" />
        </span>
      </div>

      <VariantOptions groups={variant.variantOptions} metadata={variant.attributeMetadata} />

      <div className="product-buy-box__card">
        <Price value={variant.price} oldValue={variant.oldPrice} size="lg" className="product-buy-box__price" />

        {cart.inStock && (
          <div className="product-buy-box__actions">
            <div className="product-buy-box__quantity" role="group" aria-label="Количество">
              <button
                type="button"
                className="product-buy-box__quantity-button"
                onClick={cart.decrement}
                disabled={!cart.inCart && cart.quantity <= 1}
                aria-label={cart.inCart && cart.quantity <= 1 ? 'Убрать из корзины' : 'Уменьшить количество'}
              >
                <MinusIcon width={16} height={16} />
              </button>
              <span className="product-buy-box__quantity-value" aria-live="polite">
                {cart.quantity}
              </span>
              <button
                type="button"
                className="product-buy-box__quantity-button"
                onClick={cart.increment}
                disabled={!cart.canIncrement}
                aria-label="Увеличить количество"
              >
                <PlusIcon width={16} height={16} />
              </button>
            </div>

            {cart.inCart ? (
              <Link href="/cart" className="product-buy-box__buy product-buy-box__buy--in-cart">
                В корзине
                <ArrowRightIcon width={16} height={16} />
              </Link>
            ) : (
              <button type="button" className="product-buy-box__buy" onClick={cart.buy}>
                Купить
              </button>
            )}
          </div>
        )}

        <a href={phone.href} className="product-buy-box__phone">
          <PhoneIcon width={15} height={15} strokeWidth={1.8} />
          Заказ по телефону
        </a>
      </div>

      <div className="product-buy-box__jumps">
        <button type="button" className="product-buy-box__jump" onClick={() => onJump('characteristics')}>
          <BulletListIcon className="product-buy-box__jump-icon" width={18} height={18} strokeWidth={1.7} />
          <span className="product-buy-box__jump-label">Характеристики и описание</span>
          <ChevronDownIcon className="product-buy-box__jump-chevron" width={16} height={16} />
        </button>
        <button type="button" className="product-buy-box__jump" onClick={() => onJump('delivery')}>
          <TruckIcon className="product-buy-box__jump-icon" width={18} height={18} strokeWidth={1.7} />
          <span className="product-buy-box__jump-label">Доставка и оплата</span>
          <ChevronDownIcon className="product-buy-box__jump-chevron" width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
