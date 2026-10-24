import './InfoBlocks.css';
import './PaymentInfo.css';
import type { CSSProperties, ReactNode } from 'react';
import { CardCheckIcon, CardIcon } from '@/components/ui/icons';
import { PAYMENT_METHODS, type PaymentMethodKey } from '@/config/payment';

// Иконки разные по макетам: на странице /payment — карта и карта с галочкой.
const ICONS: Record<PaymentMethodKey, ReactNode> = {
  'on-delivery': <CardIcon width={22} height={22} strokeWidth={1.7} />,
  online: <CardCheckIcon width={22} height={22} strokeWidth={1.7} />,
};

/** Полный блок способов оплаты для страницы /payment. */
export function PaymentInfo() {
  return (
    <div className="info-blocks">
      <div className="info-blocks__grid" style={{ '--info-column': '320px' } as CSSProperties}>
        {PAYMENT_METHODS.map((method) => (
          <div key={method.key} className="info-card payment-method">
            <div className="payment-method__head">
              <span className="info-icon">{ICONS[method.key]}</span>
              <h2 className="info-card__title payment-method__title">{method.title}</h2>
            </div>
            <p className="info-card__text">{method.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
