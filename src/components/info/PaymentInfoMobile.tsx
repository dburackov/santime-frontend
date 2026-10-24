import './PaymentInfoMobile.css';
import type { ReactNode } from 'react';
import { BanknoteIcon, CardIcon } from '@/components/ui/icons';
import { PAYMENT_METHODS, type PaymentMethodKey } from '@/config/payment';
import { InfoMobileCard } from './InfoMobileCard';

// Иконки разные по макетам: в мобильной сводке оплата при получении — купюра.
const ICONS: Record<PaymentMethodKey, ReactNode> = {
  'on-delivery': <BanknoteIcon width={18} height={18} strokeWidth={1.8} />,
  online: <CardIcon width={18} height={18} strokeWidth={1.8} />,
};

/** Оплата на мобильной карточке товара: только названия способов, подробности — по стрелке. */
export function PaymentInfoMobile() {
  return (
    <InfoMobileCard to="/payment" moreLabel="Подробнее об оплате">
      <ul className="payment-mobile">
        {PAYMENT_METHODS.map((method) => (
          <li key={method.key} className="payment-mobile__row">
            <span className="payment-mobile__icon">{ICONS[method.key]}</span>
            {method.shortTitle}
          </li>
        ))}
      </ul>
    </InfoMobileCard>
  );
}
