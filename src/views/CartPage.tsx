'use client';

import Link from 'next/link';
import './CartPage.css';
import { useCart } from '@/cart/useCart';
import { useCartQuote, type CartLineIssue } from '@/cart/useCartQuote';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { Price } from '@/components/ui/Price';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CurrencySymbol } from '@/components/ui/CurrencySymbol';
import { PromoCodeField } from '@/components/cart/PromoCodeField';
import {
  AlertIcon,
  ArrowRightIcon,
  CartIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
} from '@/components/ui/icons';
import { COURIER, isCourierFree } from '@/config/delivery';
import { formatPrice } from '@/utils/price';
import { formatProductsCount } from '@/utils/plural';

const CRUMBS = [{ label: 'Главная', to: '/' }, { label: 'Корзина' }];

/** Проблемы, при которых позицию нельзя заказать ни в каком количестве. */
const BLOCKING_ISSUES: Partial<Record<CartLineIssue, string>> = {
  unavailable: 'Снят с продажи',
  'out-of-stock': 'Закончился',
};

export function CartPage() {
  const { items, isHydrated, setQuantity, removeItem } = useCart();
  const quote = useCartQuote();

  if (!isHydrated || items.length === 0 || !quote.isReady) {
    return (
      <div className="container cart-page">
        <Breadcrumbs items={CRUMBS} />
        <div className="cart-page__head">
          <h1 className="cart-page__title">Корзина</h1>
        </div>
        {isHydrated && items.length === 0 && (
          <div className="cart-empty">
            <span className="cart-empty__icon">
              <CartIcon width={24} height={24} strokeWidth={1.7} />
            </span>
            <h2 className="cart-empty__title">В корзине пока ничего нет</h2>
            <p className="cart-empty__text">Добавьте товары из каталога, чтобы оформить заказ.</p>
            <Link href="/catalog" className="cart-page__cta cart-empty__cta">
              Перейти в каталог
            </Link>
          </div>
        )}
      </div>
    );
  }

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const payable = quote.totalPrice;
  const courierFree = isCourierFree(payable);
  const progress = Math.min(100, (payable / COURIER.freeFrom) * 100);

  return (
    <div className="container cart-page">
      <Breadcrumbs items={CRUMBS} />
      <div className="cart-page__head">
        <h1 className="cart-page__title">Корзина</h1>
        <span className="cart-page__count">{formatProductsCount(count)}</span>
      </div>

      <div className="cart-page__layout">
        <ul className="cart-page__list">
          {items.map((item) => {
            const line = quote.lines[item.variantId];
            const blockedLabel = line.issue ? BLOCKING_ISSUES[line.issue] : undefined;
            const blocked = blockedLabel !== undefined;
            const stock = line.stockQuantity;
            const atStockLimit = stock !== null && item.quantity >= stock;
            return (
              <li className={`cart-item${blocked ? ' cart-item--blocked' : ''}`} key={item.variantId}>
                <Link href={`/product/${item.variantSlug}`} tabIndex={-1} aria-hidden="true">
                  <ProductPhoto image={item.image} alt="" size="thumb" />
                </Link>

                <div className="cart-item__info">
                  <Link href={`/product/${item.variantSlug}`} className="cart-item__name">
                    {item.productName}
                  </Link>
                  {item.quantity > 1 && !blocked && (
                    <span className="cart-item__unit">
                      {formatPrice(line.price)} <CurrencySymbol /> за шт.
                    </span>
                  )}
                  {line.previousPrice !== null && !blocked && (
                    <span className="cart-item__note">
                      Цена изменилась, было {formatPrice(line.previousPrice)} <CurrencySymbol />
                    </span>
                  )}
                  {line.issue === 'insufficient-stock' && stock !== null && (
                    <span className="cart-item__note cart-item__note--issue">
                      В наличии только {stock} шт.
                      <button
                        type="button"
                        className="cart-item__fix"
                        onClick={() => setQuantity(item.variantId, stock)}
                      >
                        Оставить {stock}
                      </button>
                    </span>
                  )}
                </div>

                <div className="cart-item__qty" role="group" aria-label="Количество">
                  <button
                    type="button"
                    className="cart-item__qty-btn"
                    onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                    disabled={blocked || item.quantity <= 1}
                    aria-label="Уменьшить количество"
                  >
                    <MinusIcon width={14} height={14} />
                  </button>
                  <span className="cart-item__qty-value" aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="cart-item__qty-btn"
                    onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                    disabled={blocked || atStockLimit}
                    aria-label="Увеличить количество"
                  >
                    <PlusIcon width={14} height={14} />
                  </button>
                </div>

                {blocked ? (
                  <span className="cart-item__sum cart-item__status">{blockedLabel}</span>
                ) : (
                  <Price value={line.price * item.quantity} size="md" className="cart-item__sum" />
                )}

                <button
                  type="button"
                  className="cart-item__remove touch-target"
                  onClick={() => removeItem(item.variantId)}
                  aria-label="Удалить из корзины"
                >
                  <TrashIcon width={18} height={18} strokeWidth={1.7} />
                </button>
              </li>
            );
          })}
        </ul>

        <aside className="cart-summary" aria-label="Ваш заказ">
          <h2 className="cart-summary__title">Ваш заказ</h2>

          <dl className="cart-summary__lines">
            <div className="cart-summary__line">
              <dt>Товары, {quote.count} шт.</dt>
              <dd>
                {formatPrice(quote.subtotal)} <CurrencySymbol />
              </dd>
            </div>
            {quote.promoApplied && (
              <div className="cart-summary__line cart-summary__line--discount">
                <dt>Скидка по промокоду</dt>
                <dd>
                  −{formatPrice(quote.discountAmount)} <CurrencySymbol />
                </dd>
              </div>
            )}
          </dl>

          <div className="cart-summary__total">
            <span>Итого</span>
            <Price value={payable} size="lg" className="cart-summary__total-price" />
          </div>

          {courierFree ? (
            <p className="cart-summary__delivery cart-summary__delivery--free">
              <CheckIcon width={16} height={16} />
              Доставим по Минску бесплатно
            </p>
          ) : (
            <div className="cart-summary__delivery">
              <p className="cart-summary__delivery-text">
                <TruckIcon width={16} height={16} strokeWidth={1.7} />
                <span>
                  Ещё {formatPrice(COURIER.freeFrom - payable)} <CurrencySymbol /> — и доставим по Минску бесплатно
                </span>
              </p>
              <div className="cart-summary__progress" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <PromoCodeField quote={quote} />

          {quote.hasIssues ? (
            <>
              <p className="cart-summary__alert" role="alert">
                <AlertIcon width={16} height={16} />
                <span>Часть товаров нельзя заказать. Удалите их или уменьшите количество.</span>
              </p>
              <span className="cart-page__cta cart-page__cta--disabled" aria-disabled="true">
                Оформить заказ
                <ArrowRightIcon width={16} height={16} />
              </span>
            </>
          ) : (
            <Link href="/checkout" className="cart-page__cta">
              Оформить заказ
              <ArrowRightIcon width={16} height={16} />
            </Link>
          )}
          <Link href="/catalog" className="cart-summary__continue">
            Продолжить покупки
          </Link>
        </aside>
      </div>
    </div>
  );
}
