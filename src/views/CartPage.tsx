'use client';

import Link from 'next/link';
import './CartPage.css';
import { useCart } from '@/cart/useCart';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CloseIcon } from '@/components/ui/icons';

export function CartPage() {
  const { items, totalPrice, setQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <h1 className="cart-page__title">Корзина</h1>
        <EmptyState title="Корзина пуста" description="Добавьте товары из каталога, чтобы оформить заказ." />
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <h1 className="cart-page__title">Корзина</h1>

      <div className="cart-page__list">
        {items.map((item) => (
          <div className="cart-item" key={item.variantId}>
            <Link href={`/product/${item.variantSlug}`} className="cart-item__link">
              <ProductPhoto image={item.image} alt={item.productName} size="thumb" />
              <span className="cart-item__name">{item.productName}</span>
            </Link>

            <div className="cart-item__qty" role="group" aria-label="Количество">
              <button
                type="button"
                className="cart-item__qty-btn touch-target"
                onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                aria-label="Уменьшить количество"
              >
                −
              </button>
              <span className="cart-item__qty-value mono-num">{item.quantity}</span>
              <button
                type="button"
                className="cart-item__qty-btn touch-target"
                onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                aria-label="Увеличить количество"
              >
                +
              </button>
            </div>

            <div className="cart-item__end">
              <Price value={item.price * item.quantity} size="md" />

              <button
                type="button"
                className="cart-item__remove touch-target"
                onClick={() => removeItem(item.variantId)}
                aria-label="Удалить из корзины"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-page__summary">
        <div className="cart-page__total">
          <span>Итого</span>
          <Price value={totalPrice} size="lg" />
        </div>
        <Link href="/checkout">
          <Button>Оформить заказ</Button>
        </Link>
      </div>
    </div>
  );
}
