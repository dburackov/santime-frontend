'use client';

import { Fragment, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import './OrderConfirmationPage.css';
import { Price } from '@/components/ui/Price';
import { CurrencySymbol } from '@/components/ui/CurrencySymbol';
import { ProductPhoto } from '@/components/ui/ProductPhoto';
import { BoxIcon, CardIcon, CheckIcon, TruckIcon, UserIcon, WarehouseIcon } from '@/components/ui/icons';
import { loadLastOrder } from '@/cart/lastOrder';
import type { LastOrder } from '@/cart/lastOrder';
import { COURIER, PICKUP, isCourierFree } from '@/config/delivery';
import { SITE_PHONES } from '@/config/siteInfo';
import { deliveryMethodLabel, paymentMethodLabel } from '@/utils/orderLabels';
import { formatPhone } from '@/utils/phone';
import { formatPrice } from '@/utils/price';

function SuccessBadge() {
  return (
    <span className="order-confirmation__badge">
      <CheckIcon width={30} height={30} strokeWidth={2.4} />
    </span>
  );
}

export function OrderConfirmationPage() {
  // sessionStorage читается только после монтирования — на сервере его нет.
  // undefined — ещё не прочитан, null — заказа в сессии нет.
  const [lastOrder, setLastOrder] = useState<LastOrder | null | undefined>(undefined);

  useEffect(() => {
    // Паттерн гидрации, см. пояснение в CartContext: sessionStorage доступен
    // только в браузере.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastOrder(loadLastOrder());
  }, []);

  if (lastOrder === undefined) {
    return <div className="container order-confirmation" aria-busy="true" />;
  }

  if (!lastOrder) {
    return (
      <div className="container order-confirmation">
        <div className="order-confirmation__hero">
          <SuccessBadge />
          <h1 className="order-confirmation__title">Заказ оформлен</h1>
          <p className="order-confirmation__lead">
            Детали заказа видны только сразу после оформления. Заказ уже принят — менеджер свяжется с Вами для
            подтверждения.
          </p>
        </div>
        <div className="order-confirmation__actions">
          <Link href="/catalog" className="order-confirmation__button">
            Продолжить покупки
          </Link>
        </div>
      </div>
    );
  }

  const { order, images } = lastOrder;
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const discounted = order.discountAmount > 0;
  const address = [order.city, order.address, order.postalCode].filter(Boolean).join(', ');
  const courierFree = isCourierFree(order.totalPrice);

  const createdAt = new Date(order.createdAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const delivery: { icon: ReactNode; place: string; note: string | null; price: ReactNode; free: boolean } =
    order.deliveryMethod === 'PICKUP'
      ? {
          icon: <WarehouseIcon width={16} height={16} strokeWidth={1.8} />,
          place: `${PICKUP.city}, ${PICKUP.street}`,
          note: PICKUP.hours,
          price: 'бесплатно',
          free: true,
        }
      : order.deliveryMethod === 'CARRIER'
        ? {
            icon: <BoxIcon width={16} height={16} strokeWidth={1.8} />,
            place: address,
            note: null,
            price: 'по тарифу ТК',
            free: false,
          }
        : {
            icon: <TruckIcon width={16} height={16} strokeWidth={1.8} />,
            place: address,
            note: null,
            price: courierFree ? (
              'бесплатно'
            ) : (
              <>
                {formatPrice(COURIER.price)} <CurrencySymbol />
              </>
            ),
            free: courierFree,
          };

  return (
    <div className="container order-confirmation">
      <div className="order-confirmation__hero">
        <SuccessBadge />
        <h1 className="order-confirmation__title">
          Спасибо{order.firstName ? `, ${order.firstName}` : ''}! Заказ принят
        </h1>
        <p className="order-confirmation__lead">
          Менеджер позвонит Вам
          {order.phone && (
            <>
              {' '}
              на <span className="order-confirmation__nowrap">{formatPhone(order.phone)}</span>
            </>
          )}
          , чтобы подтвердить заказ.
        </p>
      </div>

      <section className="order-card" aria-labelledby="oc-number">
        <header className="order-card__head">
          <div className="order-card__heading">
            <h2 id="oc-number" className="order-card__number">
              Заказ №{order.id}
            </h2>
            <span className="order-card__date">{createdAt}</span>
          </div>
          <span className="order-card__status">Принят</span>
        </header>

        <ul className="order-card__items">
          {order.items.map((item) => (
            <li key={item.id} className="order-card__item">
              <ProductPhoto image={images[item.productVariantId] ?? null} alt="" size="thumb" />
              <span className="order-card__item-info">
                <span className="order-card__item-name">{item.productName}</span>
                <span className="order-card__item-unit">
                  {item.quantity} шт.
                  {item.quantity > 1 && (
                    <>
                      {' '}
                      × {formatPrice(item.price)} <CurrencySymbol />
                    </>
                  )}
                </span>
              </span>
              <Price value={item.price * item.quantity} size="md" className="order-card__item-sum" />
            </li>
          ))}
        </ul>

        <div className="order-card__totals">
          {discounted && (
            <dl className="order-card__lines">
              <div className="order-card__line">
                <dt>Товары, {count} шт.</dt>
                <dd>
                  {formatPrice(order.subtotal)} <CurrencySymbol />
                </dd>
              </div>
              <div className="order-card__line order-card__line--discount">
                <dt>Промокод {order.promoCode}</dt>
                <dd>
                  −{formatPrice(order.discountAmount)} <CurrencySymbol />
                </dd>
              </div>
            </dl>
          )}
          <div className="order-card__total">
            <span>Итого</span>
            <Price value={order.totalPrice} size="lg" className="order-card__total-price" />
          </div>
          <p className="order-card__delivery-cost">
            Доставка <span className={delivery.free ? 'order-card__free' : undefined}>{delivery.price}</span>
          </p>
        </div>

        <div className="order-card__foot">
          <dl className="order-card__details">
            <div className="order-card__detail">
              <dt>
                {delivery.icon}
                {deliveryMethodLabel(order.deliveryMethod)}
              </dt>
              <dd>
                {delivery.place}
                {delivery.note && <span className="order-card__muted">{delivery.note}</span>}
              </dd>
            </div>
            <div className="order-card__detail">
              <dt>
                <CardIcon width={16} height={16} strokeWidth={1.8} />
                Оплата
              </dt>
              <dd>{paymentMethodLabel(order.paymentMethod)}</dd>
            </div>
            <div className="order-card__detail">
              <dt>
                <UserIcon width={16} height={16} strokeWidth={1.8} />
                Получатель
              </dt>
              <dd>
                {[order.firstName, order.lastName].filter(Boolean).join(' ')}
                {order.phone && <span className="order-card__muted">{formatPhone(order.phone)}</span>}
              </dd>
            </div>
          </dl>

          {order.comment && (
            <p className="order-card__comment">
              <span className="order-card__muted">Комментарий:</span> {order.comment}
            </p>
          )}
        </div>
      </section>

      <p className="order-confirmation__help">
        Что-то указали неверно? Позвоните нам:{' '}
        {SITE_PHONES.map((phone, index) => (
          <Fragment key={phone.href}>
            {index > 0 && ' или '}
            <a href={phone.href} className="order-confirmation__phone">
              {phone.display}
            </a>
          </Fragment>
        ))}
      </p>

      <div className="order-confirmation__actions">
        <Link href="/catalog" className="order-confirmation__button">
          Продолжить покупки
        </Link>
      </div>
    </div>
  );
}
