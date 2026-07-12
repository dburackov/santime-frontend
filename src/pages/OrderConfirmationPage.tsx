import { Link, useLocation } from 'react-router-dom';
import './OrderConfirmationPage.css';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import type { OrderResponse } from '@/api/types';

export function OrderConfirmationPage() {
  const location = useLocation();
  const order = (location.state as { order?: OrderResponse } | null)?.order;

  if (!order) {
    return (
      <div className="container order-confirmation">
        <h1>Заказ оформлен</h1>
        <p className="order-confirmation__text">
          Детали заказа доступны только сразу после оформления. Если вы обновили страницу — не переживайте,
          заказ уже принят в обработку.
        </p>
        <Link to="/">
          <Button>На главную</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container order-confirmation">
      <h1>Спасибо за заказ!</h1>
      <p className="order-confirmation__text">
        Заказ <span className="mono-num">№{order.id}</span> принят в обработку. Мы свяжемся с вами для
        подтверждения.
      </p>

      <div className="order-confirmation__card">
        <ul className="order-confirmation__items">
          {order.items.map((item) => (
            <li key={item.id} className="order-confirmation__item">
              <span>
                {item.productName} <span className="mono-num">× {item.quantity}</span>
              </span>
              <Price value={item.price * item.quantity} size="sm" />
            </li>
          ))}
        </ul>
        <div className="order-confirmation__total">
          <span>Итого</span>
          <Price value={order.totalPrice} size="lg" />
        </div>
      </div>

      <Link to="/">
        <Button variant="secondary">Продолжить покупки</Button>
      </Link>
    </div>
  );
}
