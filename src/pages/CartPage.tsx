import { Link } from 'react-router-dom';
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
            <Link to={`/product/${item.variantSlug}`} className="cart-item__link">
              <ProductPhoto alt={item.productName} size="thumb" />
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
        ))}
      </div>

      <div className="cart-page__summary">
        <div className="cart-page__total">
          <span>Итого</span>
          <Price value={totalPrice} size="lg" />
        </div>
        <Button disabled title="Оформление заказов появится, когда бэкенд будет поддерживать создание заказов">
          Оформить заказ
        </Button>
        <p className="cart-page__note">
          Оформление заказов пока недоступно — в API магазина ещё нет эндпоинта для создания заказа.
        </p>
      </div>
    </div>
  );
}
