import './InfoBlocks.css';
import './PaymentInfo.css';
import type { CSSProperties } from 'react';
import { CardCheckIcon, CardIcon } from '@/components/ui/icons';

const METHODS = [
  {
    icon: <CardIcon width={22} height={22} strokeWidth={1.7} />,
    title: 'Наличными или картой при получении',
    text: 'Расчёт в белорусских рублях курьеру — наличными либо картой через мобильный терминал.',
  },
  {
    icon: <CardCheckIcon width={22} height={22} strokeWidth={1.7} />,
    title: 'Онлайн-оплата картой (E-POS)',
    text: 'Оплата банковской картой при оформлении заказа через систему E-POS.',
  },
];

/** Полный блок способов оплаты для страницы /payment. */
export function PaymentInfo() {
  return (
    <div className="info-blocks">
      <div className="info-blocks__grid" style={{ '--info-column': '320px' } as CSSProperties}>
        {METHODS.map((method) => (
          <div key={method.title} className="info-card payment-method">
            <div className="payment-method__head">
              <span className="info-icon">{method.icon}</span>
              <h2 className="info-card__title payment-method__title">{method.title}</h2>
            </div>
            <p className="info-card__text">{method.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
